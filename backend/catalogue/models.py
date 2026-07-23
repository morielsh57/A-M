from django.db import models

from accounts.models import Supplier


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    short_id = models.CharField(max_length=255, unique=True)
    main_category_name = models.CharField(max_length=255)
    sub_category_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    parent_category = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="subcategories",
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "categories"

    def __str__(self):
        if self.sub_category_name:
            return f"{self.main_category_name} - {self.sub_category_name}"
        return self.main_category_name


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    catalog_number = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    information = models.TextField(blank=True, null=True)
    images = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    tags = models.TextField(blank=True, null=True)
    fabric = models.CharField(max_length=255, blank=True, null=True)
    color = models.CharField(max_length=100, blank=True, null=True)
    size = models.CharField(max_length=100, blank=True, null=True)
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
