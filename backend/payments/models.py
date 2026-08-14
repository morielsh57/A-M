from django.conf import settings
from django.db import models

from carts.models import Cart
from products.models import Product, ProductVariant


class Payment(models.Model):
    class Status(models.TextChoices):
        CREATED = "CREATED", "Created"
        PAYER_ACTION_REQUIRED = "PAYER_ACTION_REQUIRED", "Payer action required"
        APPROVED = "APPROVED", "Approved"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    payment_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments"
    )
    cart = models.ForeignKey(Cart, on_delete=models.PROTECT, related_name="payments")
    provider_order_id = models.CharField(max_length=64, unique=True)
    provider_capture_id = models.CharField(
        max_length=64, unique=True, blank=True, null=True
    )
    idempotency_key = models.UUIDField(unique=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.CREATED
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3)
    provider_response = models.JSONField(default=dict, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"


class PaymentItem(models.Model):
    payment_item_id = models.AutoField(primary_key=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=255)
    color = models.CharField(max_length=100, blank=True, null=True)
    size = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "payment_items"
        constraints = [
            models.UniqueConstraint(
                fields=("payment", "variant"), name="one_payment_item_per_variant"
            )
        ]
