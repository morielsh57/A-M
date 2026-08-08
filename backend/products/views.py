from django.db.models import Avg, Count, DecimalField, Exists, OuterRef, Prefetch, Q, Value
from django.db.models.functions import Coalesce
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdministrator
from catalogue.models import Category
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer
from products.models import Product, ProductImage, ProductVariant
from products.serializers import (
    AdminProductDetailSerializer,
    AdminProductImageWriteSerializer,
    AdminProductListSerializer,
    AdminProductVariantWriteSerializer,
    AdminProductWriteSerializer,
    MessageSerializer,
    ProductCardSerializer,
    ProductCatalogueQuerySerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
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

    products = (
        Product.objects.select_related("category", "supplier")
        .prefetch_related(
            Prefetch("variants", queryset=variants),
            Prefetch("images", queryset=images),
        )
        .annotate(
            average_rating=Coalesce(
                Avg("reviews__stars"),
                Value(0),
                output_field=DecimalField(max_digits=3, decimal_places=2),
            ),
            rating_count=Count("reviews", distinct=True),
        )
    )
    if active_only:
        products = products.filter(is_active=True)
    return products


def filter_products_by_category(queryset, request):
    category_id = request.query_params.get("category")
    if not category_id:
        return queryset
    return queryset.filter(category_id=category_id)


def filter_public_products(queryset, filters):
    search = filters.get("search")
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(catalog_number__icontains=search)
            | Q(description__icontains=search)
            | Q(information__icontains=search)
            | Q(tags__icontains=search)
            | Q(fabric__icontains=search)
        )

    category_id = filters.get("category")
    if category_id is not None:
        category = (
            Category.objects.filter(category_id=category_id, is_active=True)
            .exclude(parent_category__is_active=False)
            .first()
        )
        if category is None:
            raise ValidationError({"category": ["Category was not found."]})
        if category.parent_category_id is None:
            queryset = queryset.filter(
                Q(category=category)
                | Q(category__parent_category=category, category__is_active=True)
            )
        else:
            queryset = queryset.filter(category=category)

    if "min_price" in filters:
        queryset = queryset.filter(price__gte=filters["min_price"])
    if "max_price" in filters:
        queryset = queryset.filter(price__lte=filters["max_price"])

    size = filters.get("size")
    color = filters.get("color")
    has_availability_filter = "in_stock" in filters
    if size or color or has_availability_filter:
        matching_variants = ProductVariant.objects.filter(
            product_id=OuterRef("pk"),
            is_active=True,
        )
        if size:
            matching_variants = matching_variants.filter(size__iexact=size)
        if color:
            matching_variants = matching_variants.filter(color__iexact=color)

        if has_availability_filter and filters["in_stock"]:
            matching_variants = matching_variants.filter(quantity__gt=0)
            queryset = queryset.filter(Exists(matching_variants))
        elif has_availability_filter:
            queryset = queryset.filter(Exists(matching_variants)).filter(
                ~Exists(matching_variants.filter(quantity__gt=0))
            )
        else:
            queryset = queryset.filter(Exists(matching_variants))

    ordering = filters.get("ordering", "-date_created")
    ordering_map = {
        "name": ("name", "product_id"),
        "-name": ("-name", "product_id"),
        "price": ("price", "product_id"),
        "-price": ("-price", "product_id"),
        "rating": ("average_rating", "product_id"),
        "-rating": ("-average_rating", "product_id"),
        "date_created": ("date_created", "product_id"),
        "-date_created": ("-date_created", "product_id"),
    }
    return queryset.order_by(*ordering_map[ordering])


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
            OpenApiParameter("search", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("size", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("color", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("min_price", OpenApiTypes.DECIMAL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("max_price", OpenApiTypes.DECIMAL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("in_stock", bool, OpenApiParameter.QUERY, required=False),
            OpenApiParameter(
                "ordering",
                str,
                OpenApiParameter.QUERY,
                required=False,
                enum=[
                    "name", "-name", "price", "-price", "rating", "-rating",
                    "date_created", "-date_created",
                ],
            ),
            OpenApiParameter("page", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("page_size", int, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: ProductCardSerializer(many=True), 400: ErrorResponseSerializer},
        auth=[],
        tags=["Products"],
    )
    def get(self, request):
        query_serializer = ProductCatalogueQuerySerializer(data=request.query_params.dict())
        query_serializer.is_valid(raise_exception=True)
        public_products = get_product_queryset(active_only=True).filter(
            category__is_active=True,
        ).exclude(
            category__parent_category_id__isnull=False,
            category__parent_category__is_active=False,
        )
        products = filter_public_products(
            public_products,
            query_serializer.validated_data,
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
    permission_classes = [IsAuthenticated, IsAdministrator]

    @extend_schema(
        summary="List admin products",
        description=(
            "Authenticated Admin endpoint. Returns product groups for management tables."
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
        description="Authenticated Admin endpoint. Creates shared product data only.",
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
        return get_product_queryset()


class AdminProductAccessMixin:
    permission_classes = [IsAuthenticated, IsAdministrator]

    def get_product(self, request, product_id):
        product = get_product_queryset().filter(product_id=product_id).first()
        if product is None:
            raise NotFound("Product was not found.")
        return product


class AdminProductDetailView(AdminProductAccessMixin, APIView):

    @extend_schema(
        summary="View admin product details",
        description="Authenticated Admin endpoint. Returns product data and variants.",
        responses={200: AdminProductDetailSerializer, 404: ErrorResponseSerializer},
        tags=["Admin Products"],
    )
    def get(self, request, product_id):
        product = self.get_product(request, product_id)
        return Response(AdminProductDetailSerializer(product).data)

    @extend_schema(
        summary="Update an admin product",
        description="Authenticated Admin endpoint. Updates shared product fields only.",
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

    @extend_schema(
        summary="Delete an unreferenced product",
        description=(
            "Authenticated Admin endpoint. Products referenced by carts or reviews "
            "must be deactivated instead of deleted."
        ),
        responses={204: None, 400: ErrorResponseSerializer, 404: ErrorResponseSerializer},
        tags=["Admin Products"],
    )
    def delete(self, request, product_id):
        product = self.get_product(request, product_id)
        if product.reviews.exists() or product.variants.filter(
            cart_products__isnull=False,
        ).exists():
            raise ValidationError(
                {"product_id": ["Referenced products must be deactivated instead of deleted."]}
            )
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductVariantCreateView(AdminProductAccessMixin, APIView):
    @extend_schema(
        summary="Create a product variant",
        description="Authenticated Admin endpoint. Creates one color/size variant.",
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


class AdminProductVariantDetailView(AdminProductAccessMixin, APIView):
    @extend_schema(
        summary="Update a product variant",
        description="Authenticated Admin endpoint. Updates one color/size variant.",
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
        self.get_product(request, product_id)
        variant = self.get_variant(product_id, variant_id)
        if variant.cart_products.exists():
            raise ValidationError(
                {"variant_id": ["This variant is referenced by cart or order history."]}
            )
        variant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_variant(self, product_id, variant_id):
        variant = ProductVariant.objects.filter(
            product_id=product_id,
            variant_id=variant_id,
        ).first()
        if variant is None:
            raise NotFound("Product variant was not found.")
        return variant


class AdminProductImageListCreateView(AdminProductAccessMixin, APIView):
    serializer_class = ProductImageSerializer

    def get(self, request, product_id):
        product = self.get_product(request, product_id)
        return Response(ProductImageSerializer(product.images.all(), many=True).data)

    def post(self, request, product_id):
        product = self.get_product(request, product_id)
        serializer = AdminProductImageWriteSerializer(
            data=request.data,
            context={"product": product},
        )
        serializer.is_valid(raise_exception=True)
        image = serializer.save(product=product)
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


class AdminProductImageDetailView(AdminProductAccessMixin, APIView):
    serializer_class = ProductImageSerializer

    def patch(self, request, product_id, image_id):
        product = self.get_product(request, product_id)
        image = self.get_image(product_id, image_id)
        serializer = AdminProductImageWriteSerializer(
            image,
            data=request.data,
            partial=True,
            context={"product": product},
        )
        serializer.is_valid(raise_exception=True)
        return Response(ProductImageSerializer(serializer.save()).data)

    def delete(self, request, product_id, image_id):
        self.get_product(request, product_id)
        image = self.get_image(product_id, image_id)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_image(self, product_id, image_id):
        image = ProductImage.objects.filter(product_id=product_id, image_id=image_id).first()
        if image is None:
            raise NotFound("Product image was not found.")
        return image
