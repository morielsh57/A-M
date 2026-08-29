from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsCustomer
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer
from products.models import Product
from reviews.models import Review
from reviews.serializers import (
    ReviewCreateSerializer,
    ReviewSerializer,
    ReviewUpdateSerializer,
)


class ProductReviewListCreateView(APIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsCustomer()]

    def get_product(self, product_id):
        product = Product.objects.filter(pk=product_id).first()
        if product is None:
            raise NotFound("Product was not found.")
        return product

    @extend_schema(
        summary="List reviews for a product",
        responses={200: ReviewSerializer(many=True), 404: ErrorResponseSerializer},
        auth=[],
        tags=["Product Reviews"],
    )
    def get(self, request, product_id):
        product = self.get_product(product_id)
        reviews = Review.objects.filter(product=product).select_related(
            "customer"
        ).order_by("-date_created", "-review_id")
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(reviews, request)
        return paginator.get_paginated_response(ReviewSerializer(page, many=True).data)

    @extend_schema(
        summary="Review a product from a completed order",
        description=(
            "Authenticated Customer endpoint. The product must belong to the specified "
            "completed order owned by the current customer."
        ),
        request=ReviewCreateSerializer,
        responses={
            201: ReviewSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Product Reviews"],
    )
    def post(self, request, product_id):
        product = self.get_product(product_id)
        serializer = ReviewCreateSerializer(
            data=request.data,
            context={"request": request, "product": product},
        )
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                review = serializer.save(customer=request.user, product=product)
        except IntegrityError as exc:
            raise ValidationError(
                {"order_id": ["This eligible purchase has already been reviewed."]}
            ) from exc
        review = Review.objects.select_related("customer").get(pk=review.pk)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class CustomerReviewDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCustomer]
    serializer_class = ReviewUpdateSerializer

    @extend_schema(
        summary="Edit the current customer's review",
        request=ReviewUpdateSerializer,
        responses={
            200: ReviewSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Product Reviews"],
    )
    def patch(self, request, review_id):
        review = Review.objects.filter(
            pk=review_id,
            customer=request.user,
        ).first()
        if review is None:
            raise NotFound("Review was not found.")
        serializer = ReviewUpdateSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        review = Review.objects.select_related("customer").get(pk=review.pk)
        return Response(ReviewSerializer(review).data)
