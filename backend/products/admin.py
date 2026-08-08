from django.contrib import admin

from products.models import Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = (ProductVariantInline,)
    list_display = ("product_id", "catalog_number", "name", "category", "supplier", "price", "is_active")
    list_filter = ("category", "supplier", "is_active")
    search_fields = ("catalog_number", "name")


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("variant_id", "product", "color", "size", "quantity", "is_active")
    list_filter = ("color", "size", "is_active")
    search_fields = ("product__catalog_number", "product__name", "color", "size")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("image_id", "product", "variant", "is_primary", "is_active", "display_order")
    list_filter = ("is_primary", "is_active")
    search_fields = ("product__catalog_number", "product__name", "public_id", "alt_text")
