import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("catalogue", "0002_product_variants"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name="Product",
                    fields=[
                        ("product_id", models.AutoField(primary_key=True, serialize=False)),
                        ("catalog_number", models.CharField(max_length=255, unique=True)),
                        ("name", models.CharField(max_length=255)),
                        ("description", models.TextField(blank=True, null=True)),
                        ("information", models.TextField(blank=True, null=True)),
                        ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                        ("tags", models.TextField(blank=True, null=True)),
                        ("fabric", models.CharField(blank=True, max_length=255, null=True)),
                        ("date_created", models.DateTimeField(auto_now_add=True)),
                        (
                            "category",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.PROTECT,
                                related_name="products",
                                to="catalogue.category",
                            ),
                        ),
                        (
                            "supplier",
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.SET_NULL,
                                related_name="products",
                                to="accounts.supplier",
                            ),
                        ),
                    ],
                    options={"db_table": "products"},
                ),
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
                                to="products.product",
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
            ],
        ),
    ]
