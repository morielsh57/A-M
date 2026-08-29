from django.db import models

from accounts.models import Supplier
from orders.models import Order


class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_ORDER = "new_order", "New order"
        CANCELLED_ORDER = "cancelled_order", "Cancelled order"

    notification_id = models.AutoField(primary_key=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=255, choices=Type.choices)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = "notifications"
        constraints = [
            models.UniqueConstraint(
                fields=("supplier", "order", "type"),
                name="unique_supplier_order_notification_type",
            )
        ]

    def __str__(self):
        return f"Notification {self.notification_id}"
