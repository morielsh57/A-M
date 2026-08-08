from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import F, Q

from accounts.models import Supplier
from catalogue.models import Category


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    catalog_number = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    information = models.TextField(blank=True, null=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
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
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "products"
        constraints = [
            models.CheckConstraint(
                condition=Q(price__gte=0),
                name="product_price_non_negative",
            )
        ]

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
    quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "product_variants"
        constraints = [
            models.UniqueConstraint(
                fields=["product", "color", "size"],
                name="unique_product_color_size_variant",
            ),
            models.CheckConstraint(
                condition=Q(quantity__gte=0),
                name="product_variant_quantity_non_negative",
            ),
        ]
        indexes = [
            models.Index(fields=["product"], name="product_variant_product_idx"),
            models.Index(fields=["color"], name="product_variant_color_idx"),
            models.Index(fields=["size"], name="product_variant_size_idx"),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.color or 'No color'} - {self.size or 'No size'}"

    @property
    def image_urls(self):
        return [image.secure_url for image in self.product_images.all()]

    @classmethod
    def set_stock(cls, variant_id, quantity):
        if quantity < 0:
            raise ValidationError({"quantity": "Stock quantity cannot be negative."})
        with transaction.atomic():
            variant = cls.objects.select_for_update().get(pk=variant_id)
            variant.quantity = quantity
            variant.full_clean()
            variant.save(update_fields=["quantity"])
            return variant

    @classmethod
    def adjust_stock(cls, variant_id, change):
        with transaction.atomic():
            updated = cls.objects.filter(
                pk=variant_id,
                quantity__gte=-change if change < 0 else 0,
            ).update(quantity=F("quantity") + change)
            if not updated:
                if not cls.objects.filter(pk=variant_id).exists():
                    raise cls.DoesNotExist
                raise ValidationError({"quantity": "Insufficient stock quantity."})
            return cls.objects.get(pk=variant_id)


class ProductImage(models.Model):
    image_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="product_images",
        blank=True,
        null=True,
    )
    public_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    pending_delete_public_id = models.CharField(max_length=255, blank=True, null=True)
    secure_url = models.URLField(max_length=1000)
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    format = models.CharField(max_length=20, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        ordering = ("display_order", "image_id")
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=Q(is_primary=True),
                name="one_primary_image_per_product",
            )
        ]
        indexes = [
            models.Index(fields=["product", "display_order"], name="product_image_order_idx"),
            models.Index(fields=["variant", "display_order"], name="variant_image_order_idx"),
        ]

    def clean(self):
        super().clean()
        if self.variant_id and self.product_id != self.variant.product_id:
            raise ValidationError(
                {"variant": "The image variant must belong to the same product."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Image {self.image_id or 'new'} for {self.product.name}"
