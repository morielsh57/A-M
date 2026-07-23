from django.conf import settings
from django.db import models

from catalogue.models import Product


class Cart(models.Model):
    cart_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="carts",
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "carts"

    def __str__(self):
        return f"Cart {self.cart_id}"


class CartProduct(models.Model):
    cart_product_id = models.AutoField(primary_key=True)
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="cart_products",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="cart_products",
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "cart_products"

    def __str__(self):
        return f"Cart {self.cart_id} - Product {self.product_id}"
