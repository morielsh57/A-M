from django.db import models

from accounts.models import Supplier
from catalogue.models import Category


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    catalog_number = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    information = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tags = models.TextField(blank=True, null=True)
    fabric = models.CharField(max_length=255, blank=True, null=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        related_name="products",
        blank=True,
        null=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "products"

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    variant_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    color = models.CharField(max_length=100, blank=True, null=True)
    size = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=0)
    images = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "product_variants"
        constraints = [
            models.UniqueConstraint(
                fields=["product", "color", "size"],
                name="unique_product_color_size_variant",
            )
        ]
        indexes = [
            models.Index(fields=["product"], name="product_variant_product_idx"),
            models.Index(fields=["color"], name="product_variant_color_idx"),
            models.Index(fields=["size"], name="product_variant_size_idx"),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.color or 'No color'} - {self.size or 'No size'}"
