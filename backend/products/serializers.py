from collections import OrderedDict

from rest_framework import serializers

from accounts.models import SUPPLIER_ROLE, Supplier
from catalogue.models import Category
from products.models import Product, ProductImage, ProductVariant


def get_user_supplier_profile(user):
    try:
        return user.supplier_profile
    except Supplier.DoesNotExist:
        return None


def get_representative_variant(variants):
    if not variants:
        return None

    with_stock_and_images = [
        variant for variant in variants if variant.quantity > 0 and get_variant_image_urls(variant)
    ]
    if with_stock_and_images:
        return with_stock_and_images[0]

    with_images = [variant for variant in variants if get_variant_image_urls(variant)]
    if with_images:
        return with_images[0]

    return variants[0]


def get_variant_image_urls(variant):
    variant_images = [
        image.secure_url for image in variant.product_images.all() if image.is_active
    ]
    if variant_images:
        return variant_images
    return [
        image.secure_url
        for image in variant.product.images.all()
        if image.is_active and image.variant_id is None
    ]


def get_color_representatives(product):
    color_groups = OrderedDict()
    for variant in product.variants.all():
        color_groups.setdefault(variant.color or "", []).append(variant)

    return [
        get_representative_variant(variants)
        for variants in color_groups.values()
        if variants
    ]


class ProductVariantSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ("variant_id", "color", "size", "quantity", "is_active", "images")
        read_only_fields = ("variant_id",)

    def get_images(self, variant):
        return get_variant_image_urls(variant)


class ProductImageSerializer(serializers.ModelSerializer):
    variant_id = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = (
            "image_id",
            "variant_id",
            "public_id",
            "secure_url",
            "width",
            "height",
            "format",
            "alt_text",
            "display_order",
            "is_primary",
            "is_active",
        )

    def get_variant_id(self, image):
        return image.variant_id


class ProductColorOptionSerializer(serializers.Serializer):
    color = serializers.CharField(allow_blank=True)
    variant_id = serializers.IntegerField()
    in_stock = serializers.BooleanField()
    images = serializers.ListField(child=serializers.CharField())


class ProductCardSerializer(serializers.ModelSerializer):
    selected_color = serializers.SerializerMethodField()
    selected_variant_id = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    colors = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "product_id",
            "catalog_number",
            "name",
            "price",
            "fabric",
            "selected_color",
            "selected_variant_id",
            "images",
            "colors",
        )

    def get_selected_variant(self, product):
        variants = list(product.variants.all())
        color_representatives = get_color_representatives(product)
        return get_representative_variant(color_representatives) or get_representative_variant(variants)

    def get_selected_color(self, product):
        variant = self.get_selected_variant(product)
        return variant.color if variant else None

    def get_selected_variant_id(self, product):
        variant = self.get_selected_variant(product)
        return variant.variant_id if variant else None

    def get_images(self, product):
        variant = self.get_selected_variant(product)
        if variant:
            return get_variant_image_urls(variant)
        return [image.secure_url for image in product.images.all() if image.is_active]

    def get_colors(self, product):
        color_options = []
        variants = list(product.variants.all())
        for variant in get_color_representatives(product):
            has_stock_for_color = any(
                item.color == variant.color and item.quantity > 0
                for item in variants
            )
            color_options.append(
                {
                    "color": variant.color or "",
                    "variant_id": variant.variant_id,
                    "in_stock": has_stock_for_color,
                    "images": get_variant_image_urls(variant),
                }
            )
        return ProductColorOptionSerializer(color_options, many=True).data


class ProductDetailSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source="category.category_id")
    supplier_id = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            "product_id",
            "catalog_number",
            "name",
            "description",
            "information",
            "price",
            "tags",
            "fabric",
            "category_id",
            "supplier_id",
            "is_active",
            "images",
            "variants",
        )

    def get_supplier_id(self, product):
        return product.supplier_id


class AdminProductListSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source="category.category_id")
    colors = serializers.SerializerMethodField()
    sizes = serializers.SerializerMethodField()
    variant_count = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "product_id",
            "catalog_number",
            "name",
            "category_id",
            "price",
            "fabric",
            "colors",
            "sizes",
            "variant_count",
            "total_quantity",
        )

    def get_colors(self, product):
        return list(
            OrderedDict.fromkeys(
                variant.color for variant in product.variants.all() if variant.color
            )
        )

    def get_sizes(self, product):
        return list(
            OrderedDict.fromkeys(
                variant.size for variant in product.variants.all() if variant.size
            )
        )

    def get_variant_count(self, product):
        return len(list(product.variants.all()))

    def get_total_quantity(self, product):
        return sum(variant.quantity for variant in product.variants.all())


class AdminProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
    )
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        source="supplier",
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Product
        fields = (
            "catalog_number",
            "name",
            "description",
            "information",
            "price",
            "tags",
            "fabric",
            "category_id",
            "supplier_id",
            "is_active",
        )

    def validate_supplier_id(self, value):
        request = self.context.get("request")
        supplier_profile = get_user_supplier_profile(request.user) if request else None
        if (
            request
            and request.user.role.role_name == SUPPLIER_ROLE
            and value is not None
            and value != supplier_profile
        ):
            raise serializers.ValidationError("Suppliers can only manage their own products.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.role.role_name == SUPPLIER_ROLE:
            supplier_profile = get_user_supplier_profile(request.user)
            if supplier_profile is None:
                raise serializers.ValidationError(
                    {"supplier_id": ["Supplier profile was not found."]}
                )
            validated_data["supplier"] = supplier_profile
        return super().create(validated_data)


class AdminProductDetailSerializer(ProductDetailSerializer):
    pass


class AdminProductVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("color", "size", "quantity", "is_active")

    def validate(self, attrs):
        product = self.context.get("product")
        if product is None and self.instance is not None:
            product = self.instance.product

        if product is None:
            return attrs

        color = attrs.get("color")
        size = attrs.get("size")
        if self.instance is not None:
            color = attrs.get("color", self.instance.color)
            size = attrs.get("size", self.instance.size)

        duplicate = ProductVariant.objects.filter(
            product=product,
            color=color,
            size=size,
        )
        if self.instance is not None:
            duplicate = duplicate.exclude(variant_id=self.instance.variant_id)
        if duplicate.exists():
            raise serializers.ValidationError(
                {"variant_id": ["A variant with this color and size already exists."]}
            )

        return attrs



class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()
