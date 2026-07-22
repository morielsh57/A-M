
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from catalogue.models import Product
from orders.models import Order


class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    review_text = models.TextField()
    stars = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        constraints = [
            models.UniqueConstraint(
                fields=["order", "product", "customer"],
                name="unique_order_product_customer_review",
            )
        ]

    def __str__(self):
        return f"Review {self.review_id}"
