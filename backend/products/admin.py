from django.contrib import admin

from products.models import Product, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = (ProductVariantInline,)
    list_display = ("product_id", "catalog_number", "name", "category", "supplier", "price")
    list_filter = ("category", "supplier")
    search_fields = ("catalog_number", "name")


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("variant_id", "product", "color", "size", "quantity")
    list_filter = ("color", "size")
    search_fields = ("product__catalog_number", "product__name", "color", "size")
