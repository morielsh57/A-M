from django.db.models import Prefetch
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ADMIN_ROLE
from accounts.permissions import HasAnyRole
from catalogue.models import Category
from catalogue.serializers import (
    CategorySerializer,
    CategoryCountSerializer,
    CategoryWriteSerializer,
    MainCategorySerializer,
    MessageSerializer,
)
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer


def paginate_queryset(request, queryset, serializer_class):
    paginator = StandardPageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page, many=True)
    return paginator.get_paginated_response(serializer.data)


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="List categories",
        description="Public endpoint. Returns category records for catalogue navigation.",
        parameters=[
            OpenApiParameter("page", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page_size", int, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: CategorySerializer(many=True)},
        auth=[],
        tags=["Catalogue"],
    )
    def get(self, request):
        categories = Category.objects.select_related("parent_category").filter(
            is_active=True,
        ).exclude(
            parent_category__is_active=False,
        ).order_by(
            "main_category_name",
            "sub_category_name",
            "category_id",
        )
        return paginate_queryset(request, categories, CategorySerializer)


class MainCategoryListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="List main categories with subcategories",
        description=(
            "Public endpoint. Returns every active main category with its active "
            "subcategories nested in an array."
        ),
        responses={200: MainCategorySerializer(many=True)},
        auth=[],
        tags=["Catalogue"],
    )
    def get(self, request):
        active_subcategories = Category.objects.filter(
            is_active=True,
        ).order_by("sub_category_name", "category_id")
        main_categories = (
            Category.objects.filter(
                is_active=True,
                parent_category_id__isnull=True,
            )
            .prefetch_related(
                Prefetch(
                    "subcategories",
                    queryset=active_subcategories,
                    to_attr="active_subcategories",
                )
            )
            .order_by("main_category_name", "category_id")
        )
        return Response(MainCategorySerializer(main_categories, many=True).data)


class CategoryCountView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Count public categories",
        description=(
            "Public endpoint. Returns the total number of active main categories and "
            "active subcategories whose parent is active."
        ),
        responses={200: CategoryCountSerializer},
        auth=[],
        tags=["Catalogue"],
    )
    def get(self, request):
        count = Category.objects.filter(is_active=True).exclude(
            parent_category__is_active=False,
        ).count()
        return Response({"count": count})


class CategoryDetailView(APIView):
    allowed_roles = frozenset({ADMIN_ROLE})

    @extend_schema(
        summary="View category details",
        description="Public endpoint. Returns one category.",
        responses={200: CategorySerializer, 404: ErrorResponseSerializer},
        auth=[],
        tags=["Catalogue"],
    )
    def get(self, request, category_id):
        category = self.get_public_category(category_id)
        return Response(CategorySerializer(category).data)

    @extend_schema(
        summary="Update a category",
        description="Authenticated Admin endpoint. Updates category fields only.",
        request=CategoryWriteSerializer,
        responses={
            200: CategorySerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Catalogue"],
    )
    def patch(self, request, category_id):
        category = self.get_category(category_id)
        serializer = CategoryWriteSerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return Response(CategorySerializer(category).data)

    @extend_schema(
        summary="Delete a category",
        description="Authenticated Admin endpoint. Deletes a category when database constraints allow it.",
        responses={
            200: MessageSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Catalogue"],
    )
    def delete(self, request, category_id):
        category = self.get_category(category_id)
        category.delete()
        return Response({"message": "Category deleted successfully."})

    def get_permissions(self):
        if self.request and self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), HasAnyRole()]

    def get_category(self, category_id):
        category = Category.objects.select_related("parent_category").filter(
            category_id=category_id,
        ).first()
        if category is None:
            raise NotFound("Category was not found.")
        return category

    def get_public_category(self, category_id):
        category = self.get_category(category_id)
        if not category.is_active or (
            category.parent_category_id and not category.parent_category.is_active
        ):
            raise NotFound("Category was not found.")
        return category
