from django.db.models import Prefetch
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ADMIN_ROLE, SUPPLIER_ROLE
from accounts.permissions import HasAnyRole
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer
from products.models import Product, ProductImage, ProductVariant
from products.serializers import (
    AdminProductDetailSerializer,
    AdminProductListSerializer,
    AdminProductVariantWriteSerializer,
    AdminProductWriteSerializer,
    MessageSerializer,
    ProductCardSerializer,
    ProductDetailSerializer,
    get_user_supplier_profile,
)


def get_product_queryset(active_only=False):
    variants = ProductVariant.objects.order_by("variant_id").prefetch_related(
        Prefetch(
            "product_images",
            queryset=ProductImage.objects.order_by("display_order", "image_id"),
        )
    )
    images = ProductImage.objects.order_by("display_order", "image_id")
    if active_only:
        variants = variants.filter(is_active=True)
        images = images.filter(is_active=True)

    products = Product.objects.select_related("category", "supplier").prefetch_related(
        Prefetch("variants", queryset=variants),
        Prefetch("images", queryset=images),
    )
    if active_only:
        products = products.filter(is_active=True)
    return products


def filter_products_by_category(queryset, request):
    category_id = request.query_params.get("category")
    if not category_id:
        return queryset
    return queryset.filter(category_id=category_id)


def paginate_queryset(request, queryset, serializer_class):
    paginator = StandardPageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page, many=True)
    return paginator.get_paginated_response(serializer.data)


class ProductListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="List product cards",
        description=(
            "Public endpoint. Returns grouped products for cards, including the selected "
            "display color, selected variant, images for that color, and color swatches."
        ),
        parameters=[
            OpenApiParameter("category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page_size", int, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: ProductCardSerializer(many=True)},
        auth=[],
        tags=["Products"],
    )
    def get(self, request):
        products = filter_products_by_category(
            get_product_queryset(active_only=True).order_by("-date_created", "product_id"),
            request,
        )
        return paginate_queryset(request, products, ProductCardSerializer)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="View product details",
        description="Public endpoint. Returns one product with every color/size variant.",
        responses={200: ProductDetailSerializer, 404: ErrorResponseSerializer},
        auth=[],
        tags=["Products"],
    )
    def get(self, request, product_id):
        product = get_product_queryset(active_only=True).filter(product_id=product_id).first()
        if product is None:
            raise NotFound("Product was not found.")
        return Response(ProductDetailSerializer(product).data)


class AdminProductListCreateView(APIView):
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({ADMIN_ROLE, SUPPLIER_ROLE})

    @extend_schema(
        summary="List admin products",
        description=(
            "Authenticated Admin/Supplier endpoint. Returns product groups for admin tables. "
            "Suppliers only see their own products."
        ),
        parameters=[
            OpenApiParameter("category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page_size", int, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: AdminProductListSerializer(many=True)},
        tags=["Admin Products"],
    )
    def get(self, request):
        products = filter_products_by_category(
            self.get_scoped_queryset(request).order_by("-date_created", "product_id"),
            request,
        )
        return paginate_queryset(request, products, AdminProductListSerializer)

    @extend_schema(
        summary="Create an admin product",
        description="Authenticated Admin/Supplier endpoint. Creates shared product data only.",
        request=AdminProductWriteSerializer,
        responses={
            201: AdminProductDetailSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
        },
        tags=["Admin Products"],
    )
    def post(self, request):
        serializer = AdminProductWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(
            AdminProductDetailSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )

    def get_scoped_queryset(self, request):
        products = get_product_queryset()
        if request.user.role.role_name == SUPPLIER_ROLE:
            return products.filter(supplier__user=request.user)
        return products


class AdminProductDetailView(APIView):
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({ADMIN_ROLE, SUPPLIER_ROLE})

    @extend_schema(
        summary="View admin product details",
        description="Authenticated Admin/Supplier endpoint. Returns product data and variants.",
        responses={200: AdminProductDetailSerializer, 404: ErrorResponseSerializer},
        tags=["Admin Products"],
    )
    def get(self, request, product_id):
        product = self.get_product(request, product_id)
        return Response(AdminProductDetailSerializer(product).data)

    @extend_schema(
        summary="Update an admin product",
        description="Authenticated Admin/Supplier endpoint. Updates shared product fields only.",
        request=AdminProductWriteSerializer,
        responses={
            200: AdminProductDetailSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Admin Products"],
    )
    def patch(self, request, product_id):
        product = self.get_product(request, product_id)
        serializer = AdminProductWriteSerializer(
            product,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(AdminProductDetailSerializer(product).data)

    def get_product(self, request, product_id):
        product = get_product_queryset().filter(product_id=product_id).first()
        if product is None:
            raise NotFound("Product was not found.")
        if request.user.role.role_name == SUPPLIER_ROLE:
            supplier_profile = get_user_supplier_profile(request.user)
            if (
                supplier_profile is None
                or product.supplier_id != supplier_profile.supplier_id
            ):
                raise PermissionDenied("You do not have permission to manage this product.")
        return product

    def require_admin(self, request):
        if request.user.role.role_name != ADMIN_ROLE:
            raise PermissionDenied("Only admins can delete products or variants.")


class AdminProductVariantCreateView(AdminProductDetailView):
    @extend_schema(
        summary="Create a product variant",
        description="Authenticated Admin/Supplier endpoint. Creates one color/size variant.",
        request=AdminProductVariantWriteSerializer,
        responses={
            201: ProductDetailSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Admin Products"],
    )
    def post(self, request, product_id):
        product = self.get_product(request, product_id)
        serializer = AdminProductVariantWriteSerializer(
            data=request.data,
            context={"product": product},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        product = get_product_queryset().get(product_id=product_id)
        return Response(
            AdminProductDetailSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductVariantDetailView(AdminProductDetailView):
    @extend_schema(
        summary="Update a product variant",
        description="Authenticated Admin/Supplier endpoint. Updates one color/size variant.",
        request=AdminProductVariantWriteSerializer,
        responses={
            200: ProductDetailSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Admin Products"],
    )
    def patch(self, request, product_id, variant_id):
        self.get_product(request, product_id)
        variant = self.get_variant(product_id, variant_id)
        serializer = AdminProductVariantWriteSerializer(
            variant,
            data=request.data,
            partial=True,
            context={"product": variant.product},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        product = get_product_queryset().get(product_id=product_id)
        return Response(AdminProductDetailSerializer(product).data)

    @extend_schema(
        summary="Delete a product variant",
        description=(
            "Authenticated Admin endpoint. Deletes one variant only when it is "
            "not referenced by cart/order history."
        ),
        responses={
            200: MessageSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Admin Products"],
    )
    def delete(self, request, product_id, variant_id):
        self.require_admin(request)
        self.get_product(request, product_id)
        variant = self.get_variant(product_id, variant_id)
        if variant.cart_products.exists():
            raise ValidationError(
                {"variant_id": ["This variant is referenced by cart or order history."]}
            )
        variant.delete()
        return Response({"message": "Product variant deleted successfully."})

    def get_variant(self, product_id, variant_id):
        variant = ProductVariant.objects.filter(
            product_id=product_id,
            variant_id=variant_id,
        ).first()
        if variant is None:
            raise NotFound("Product variant was not found.")
        return variant
