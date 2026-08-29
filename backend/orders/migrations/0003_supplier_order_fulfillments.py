import django.db.models.deletion
from django.db import migrations, models


def create_existing_fulfillments(apps, schema_editor):
    OrderItem = apps.get_model("orders", "OrderItem")
    SupplierOrderFulfillment = apps.get_model(
        "orders", "SupplierOrderFulfillment"
    )
    pairs = (
        OrderItem.objects.exclude(product__supplier_id__isnull=True)
        .values_list("order_id", "product__supplier_id", "order__order_status")
        .distinct()
    )
    SupplierOrderFulfillment.objects.bulk_create(
        [
            SupplierOrderFulfillment(
                order_id=order_id,
                supplier_id=supplier_id,
                status=order_status,
            )
            for order_id, supplier_id, order_status in pairs
        ],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_passwordresettoken"),
        ("orders", "0002_order_items_and_payment_idempotency"),
    ]

    operations = [
        migrations.CreateModel(
            name="SupplierOrderFulfillment",
            fields=[
                (
                    "fulfillment_id",
                    models.AutoField(primary_key=True, serialize=False),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("Pending", "Pending"),
                            ("Completed", "Completed"),
                            ("Cancelled", "Cancelled"),
                        ],
                        default="Pending",
                        max_length=100,
                    ),
                ),
                ("date_created", models.DateTimeField(auto_now_add=True)),
                ("date_updated", models.DateTimeField(auto_now=True)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="supplier_fulfillments",
                        to="orders.order",
                    ),
                ),
                (
                    "supplier",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="order_fulfillments",
                        to="accounts.supplier",
                    ),
                ),
            ],
            options={"db_table": "supplier_order_fulfillments"},
        ),
        migrations.AddConstraint(
            model_name="supplierorderfulfillment",
            constraint=models.UniqueConstraint(
                fields=("order", "supplier"),
                name="unique_order_supplier_fulfillment",
            ),
        ),
        migrations.RunPython(
            create_existing_fulfillments,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
