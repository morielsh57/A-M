from django.db import transaction
from django.db.models import (
    Avg,
    Case,
    Count,
    DecimalField,
    Exists,
    IntegerField,
    Max,
    OuterRef,
    Prefetch,
    Q,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ADMIN_ROLE, SUPPLIER_ROLE
from accounts.permissions import HasAnyRole
from catalogue.models import Category
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer
from products.models import Product, ProductImage, ProductVariant
from products.cloudinary_service import destroy_product_image, upload_product_image
from products.serializers import (
    AdminProductDetailSerializer,
    AdminProductImageWriteSerializer,
    AdminProductListSerializer,
    AdminProductVariantWriteSerializer,
    AdminProductWriteSerializer,
    MessageSerializer,
    ProductAutocompleteQuerySerializer,
    ProductAutocompleteSerializer,
    ProductCardSerializer,
    ProductCatalogueQuerySerializer,
    ProductCountSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductImageReplaceSerializer,
    ProductImageUploadSerializer,
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
        color_matches = ProductVariant.objects.filter(
            product_id=OuterRef("pk"),
            color__icontains=search,
            is_active=True,
        )
        queryset = queryset.annotate(search_color_matches=Exists(color_matches)).filter(
            Q(name__icontains=search)
            | Q(catalog_number__icontains=search)
            | Q(description__icontains=search)
            | Q(information__icontains=search)
            | Q(tags__icontains=search)
            | Q(fabric__icontains=search)
            | Q(search_color_matches=True)
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

    main_category_id = filters.get("main_category")
    main_category = None
    if main_category_id is not None:
        main_category = Category.objects.filter(
            category_id=main_category_id,
            parent_category_id__isnull=True,
            is_active=True,
        ).first()
        if main_category is None:
            raise ValidationError({"main_category": ["Main category was not found."]})
        queryset = queryset.filter(
            Q(category=main_category)
            | Q(category__parent_category=main_category, category__is_active=True)
        )

    sub_category_id = filters.get("sub_category")
    if sub_category_id is not None:
        sub_category = (
            Category.objects.filter(
                category_id=sub_category_id,
                parent_category_id__isnull=False,
                is_active=True,
                parent_category__is_active=True,
            )
            .select_related("parent_category")
            .first()
        )
        if sub_category is None:
            raise ValidationError({"sub_category": ["Subcategory was not found."]})
        if main_category is not None and sub_category.parent_category_id != main_category.pk:
            raise ValidationError(
                {"sub_category": ["Subcategory does not belong to the selected main category."]}
            )
        queryset = queryset.filter(category=sub_category)

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
            OpenApiParameter("main_category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sub_category", int, OpenApiParameter.QUERY, required=False),
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


class ProductAutocompleteView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Autocomplete product search",
        description=(
            "Public endpoint. Returns a limited list of active products matching a partial "
            "product name, tag, description, information, fabric, or variant color. Results "
            "are prioritized in that order."
        ),
        parameters=[
            OpenApiParameter("search", str, OpenApiParameter.QUERY, required=True),
            OpenApiParameter("limit", int, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: ProductAutocompleteSerializer(many=True), 400: ErrorResponseSerializer},
        auth=[],
        tags=["Products"],
    )
    def get(self, request):
        query_serializer = ProductAutocompleteQuerySerializer(data=request.query_params.dict())
        query_serializer.is_valid(raise_exception=True)
        search = query_serializer.validated_data["search"]
        limit = query_serializer.validated_data["limit"]

        color_matches = ProductVariant.objects.filter(
            product_id=OuterRef("pk"),
            color__icontains=search,
            is_active=True,
        )
        products = (
            Product.objects.annotate(color_matches=Exists(color_matches))
            .filter(
                Q(name__icontains=search)
                | Q(tags__icontains=search)
                | Q(description__icontains=search)
                | Q(information__icontains=search)
                | Q(fabric__icontains=search)
                | Q(color_matches=True),
                is_active=True,
                category__is_active=True,
            )
            .annotate(
                match_priority=Case(
                    When(name__icontains=search, then=Value(1)),
                    When(tags__icontains=search, then=Value(2)),
                    When(description__icontains=search, then=Value(3)),
                    When(information__icontains=search, then=Value(4)),
                    When(fabric__icontains=search, then=Value(5)),
                    When(color_matches=True, then=Value(6)),
                    output_field=IntegerField(),
                )
            )
            .exclude(
                category__parent_category_id__isnull=False,
                category__parent_category__is_active=False,
            )
            .order_by("match_priority", "name", "product_id")[:limit]
        )
        return Response(ProductAutocompleteSerializer(products, many=True).data)


class ProductCountView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Count matching catalogue products",
        description=(
            "Public endpoint. Returns only the number of active products matching the same "
            "search and filters as the public product catalogue."
        ),
        parameters=[
            OpenApiParameter("search", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("main_category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("sub_category", int, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("size", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("color", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("min_price", OpenApiTypes.DECIMAL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("max_price", OpenApiTypes.DECIMAL, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("in_stock", bool, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: ProductCountSerializer, 400: ErrorResponseSerializer},
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
        return Response({"count": products.count()})


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
            "Authenticated Admin/Supplier endpoint. Admins see all products; suppliers "
            "see only their own products."
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


class AdminProductAccessMixin:
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({ADMIN_ROLE, SUPPLIER_ROLE})

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


class AdminProductDetailView(AdminProductAccessMixin, APIView):

    @extend_schema(
        summary="View admin product details",
        description="Authenticated Admin/Supplier endpoint. Suppliers can view their own products.",
        responses={200: AdminProductDetailSerializer, 404: ErrorResponseSerializer},
        tags=["Admin Products"],
    )
    def get(self, request, product_id):
        product = self.get_product(request, product_id)
        return Response(AdminProductDetailSerializer(product).data)

    @extend_schema(
        summary="Update an admin product",
        description="Authenticated Admin/Supplier endpoint. Suppliers can add variants to their own products.",
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
        self.require_admin(request)
        product = self.get_product(request, product_id)
        if product.images.exists():
            raise ValidationError(
                {"product_id": ["Delete the product images before deleting the product."]}
            )
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
        description="Authenticated Admin/Supplier endpoint. Suppliers can update their own products.",
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
        description="Authenticated Admin/Supplier endpoint. Suppliers can update their own products.",
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
        if variant.product_images.exists():
            raise ValidationError(
                {"variant_id": ["Delete the variant images before deleting the variant."]}
            )
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
        with transaction.atomic():
            if serializer.validated_data.get("is_primary"):
                ProductImage.objects.filter(product=product, is_primary=True).exclude(
                    pk=image.pk
                ).update(is_primary=False)
            image = serializer.save()
        return Response(ProductImageSerializer(image).data)

    def delete(self, request, product_id, image_id):
        self.get_product(request, product_id)
        image = self.get_image(product_id, image_id)
        if image.pending_delete_public_id:
            destroy_product_image(image.pending_delete_public_id)
        destroy_product_image(image.public_id)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_image(self, product_id, image_id):
        image = ProductImage.objects.filter(product_id=product_id, image_id=image_id).first()
        if image is None:
            raise NotFound("Product image was not found.")
        return image


class AdminProductImageUploadView(AdminProductAccessMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ProductImageUploadSerializer

    @extend_schema(
        summary="Upload product images to Cloudinary",
        request=ProductImageUploadSerializer,
        responses={201: ProductImageSerializer(many=True), 400: ErrorResponseSerializer},
        tags=["Admin Product Images"],
    )
    def post(self, request, product_id):
        product = self.get_product(request, product_id)
        serializer = ProductImageUploadSerializer(
            data=request.data,
            context={"product": product},
        )
        serializer.is_valid(raise_exception=True)
        uploaded_assets = []
        created_images = []
        try:
            with transaction.atomic():
                Product.objects.select_for_update().get(pk=product.pk)
                primary_index = serializer.validated_data.get("primary_image_index")
                if primary_index is not None:
                    ProductImage.objects.filter(product=product, is_primary=True).update(
                        is_primary=False
                    )
                display_orders = serializer.validated_data.get("display_orders")
                if display_orders is None:
                    maximum = product.images.aggregate(value=Max("display_order"))["value"]
                    next_order = (maximum if maximum is not None else -1) + 1
                    display_orders = [
                        next_order + position
                        for position in range(len(serializer.validated_data["files"]))
                    ]
                alt_texts = serializer.validated_data.get(
                    "alt_texts",
                    [""] * len(serializer.validated_data["files"]),
                )

                for position, uploaded_file in enumerate(serializer.validated_data["files"]):
                    asset = upload_product_image(uploaded_file, product.pk)
                    uploaded_assets.append(asset)
                    created_images.append(
                        ProductImage.objects.create(
                            product=product,
                            public_id=asset["public_id"],
                            secure_url=asset["secure_url"],
                            width=asset["width"],
                            height=asset["height"],
                            format=asset["format"],
                            alt_text=alt_texts[position],
                            display_order=display_orders[position],
                            is_primary=primary_index == position,
                        )
                    )
        except Exception:
            for asset in uploaded_assets:
                destroy_product_image(asset.get("public_id"), suppress_errors=True)
            raise

        return Response(
            ProductImageSerializer(created_images, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductImageReplaceView(AdminProductAccessMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ProductImageReplaceSerializer

    @extend_schema(
        summary="Replace a Cloudinary product image",
        request=ProductImageReplaceSerializer,
        responses={200: ProductImageSerializer, 400: ErrorResponseSerializer},
        tags=["Admin Product Images"],
    )
    def post(self, request, product_id, image_id):
        product = self.get_product(request, product_id)
        image = ProductImage.objects.filter(product=product, pk=image_id).first()
        if image is None:
            raise NotFound("Product image was not found.")
        serializer = ProductImageReplaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if image.pending_delete_public_id:
            destroy_product_image(image.pending_delete_public_id)
            image.pending_delete_public_id = None
            image.save(update_fields=["pending_delete_public_id"])

        asset = upload_product_image(serializer.validated_data["file"], product.pk)
        old_public_id = image.public_id
        try:
            with transaction.atomic():
                image = ProductImage.objects.select_for_update().get(pk=image.pk)
                image.pending_delete_public_id = old_public_id
                image.public_id = asset["public_id"]
                image.secure_url = asset["secure_url"]
                image.width = asset["width"]
                image.height = asset["height"]
                image.format = asset["format"]
                image.save()
        except Exception:
            destroy_product_image(asset["public_id"], suppress_errors=True)
            raise

        if destroy_product_image(old_public_id, suppress_errors=True):
            ProductImage.objects.filter(pk=image.pk).update(pending_delete_public_id=None)
            image.pending_delete_public_id = None
        return Response(ProductImageSerializer(image).data)
