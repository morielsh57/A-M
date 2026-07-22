from django.conf import settings
from django.db import models

from carts.models import Cart


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
    payment_id = models.PositiveBigIntegerField()
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
    is_review = models.BooleanField(default=False)

    class Meta:
        db_table = "orders"

    def __str__(self):
        return f"Order {self.order_id}"
