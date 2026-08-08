import json

import django.db.models.deletion
from django.db import migrations, models


def parse_images(raw_images):
    if not raw_images:
        return []

    if isinstance(raw_images, list):
        return raw_images

    try:
        parsed = json.loads(raw_images)
    except (TypeError, ValueError):
        return [raw_images]

    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, str):
        return [parsed]
    return []


def create_variants_from_products(apps, schema_editor):
    Product = apps.get_model("catalogue", "Product")
    ProductVariant = apps.get_model("catalogue", "ProductVariant")

    variants = [
        ProductVariant(
            product=product,
            color=product.color,
            size=product.size,
            quantity=product.quantity,
            images=parse_images(product.images),
        )
        for product in Product.objects.all()
    ]

    ProductVariant.objects.bulk_create(variants)


def restore_product_variant_fields(apps, schema_editor):
    ProductVariant = apps.get_model("catalogue", "ProductVariant")

    for variant in ProductVariant.objects.select_related("product").order_by("variant_id"):
        product = variant.product
        product.color = variant.color
        product.size = variant.size
        product.quantity = variant.quantity
        product.images = json.dumps(variant.images)
        product.save(update_fields=["color", "size", "quantity", "images"])


class Migration(migrations.Migration):

    dependencies = [
        ("catalogue", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductVariant",
            fields=[
                ("variant_id", models.AutoField(primary_key=True, serialize=False)),
                ("color", models.CharField(blank=True, max_length=100, null=True)),
                ("size", models.CharField(blank=True, max_length=100, null=True)),
                ("quantity", models.PositiveIntegerField(default=0)),
                ("images", models.JSONField(blank=True, default=list)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="variants",
                        to="catalogue.product",
                    ),
                ),
            ],
            options={
                "db_table": "product_variants",
                "indexes": [
                    models.Index(
                        fields=["product"],
                        name="product_variant_product_idx",
                    ),
                    models.Index(fields=["color"], name="product_variant_color_idx"),
                    models.Index(fields=["size"], name="product_variant_size_idx"),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("product", "color", "size"),
                        name="unique_product_color_size_variant",
                    )
                ],
            },
        ),
        migrations.RunPython(
            create_variants_from_products,
            reverse_code=restore_product_variant_fields,
        ),
        migrations.RemoveField(model_name="product", name="color"),
        migrations.RemoveField(model_name="product", name="images"),
        migrations.RemoveField(model_name="product", name="quantity"),
        migrations.RemoveField(model_name="product", name="size"),
    ]
