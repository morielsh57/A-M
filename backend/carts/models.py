from django.conf import settings
from django.db import models
from django.db.models import Q

from products.models import ProductVariant


class Cart(models.Model):
    cart_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="carts",
        blank=True,
        null=True,
    )
    guest_id = models.UUIDField(blank=True, null=True, unique=True, editable=False)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carts"
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(customer__isnull=False, guest_id__isnull=True)
                    | Q(customer__isnull=True, guest_id__isnull=False)
                ),
                name="cart_has_exactly_one_owner",
            ),
        ]

    def __str__(self):
        return f"Cart {self.cart_id}"


class CartProduct(models.Model):
    cart_product_id = models.AutoField(primary_key=True)
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="cart_products",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name="cart_products",
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "cart_products"
        constraints = [
            models.UniqueConstraint(
                fields=("cart", "variant"),
                name="one_cart_item_per_variant",
            ),
        ]

    def __str__(self):
        return f"Cart {self.cart_id} - Variant {self.variant_id}"
