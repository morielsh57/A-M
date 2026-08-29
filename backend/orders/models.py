from django.conf import settings
from django.db import models

from carts.models import Cart
from accounts.models import Supplier
from products.models import Product, ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    order_id = models.AutoField(primary_key=True)
    cart = models.ForeignKey(
        Cart,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.PROTECT,
        related_name="order",
        null=True,
        blank=True,
    )
    pickup_point = models.ForeignKey(
        "pickup_points.PickUpPoint",
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_status = models.CharField(
        max_length=100,
        choices=Status.choices,
        default=Status.PENDING,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    is_review = models.BooleanField(default=False)

    class Meta:
        db_table = "orders"

    def __str__(self):
        return f"Order {self.order_id}"


class OrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    product_name = models.CharField(max_length=255)
    color = models.CharField(max_length=100, blank=True, null=True)
    size = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"
        constraints = [
            models.UniqueConstraint(
                fields=("order", "variant"),
                name="one_order_item_per_variant",
            ),
        ]

    def __str__(self):
        return f"Order {self.order_id} - Variant {self.variant_id}"


class SupplierOrderFulfillment(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    fulfillment_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="supplier_fulfillments",
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="order_fulfillments",
    )
    status = models.CharField(
        max_length=100,
        choices=Status.choices,
        default=Status.PENDING,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_order_fulfillments"
        constraints = [
            models.UniqueConstraint(
                fields=("order", "supplier"),
                name="unique_order_supplier_fulfillment",
            )
        ]

    def __str__(self):
        return f"Order {self.order_id} - Supplier {self.supplier_id}: {self.status}"
