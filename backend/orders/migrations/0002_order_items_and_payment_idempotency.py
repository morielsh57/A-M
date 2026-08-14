import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def copy_existing_cart_items_to_orders(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    OrderItem = apps.get_model("orders", "OrderItem")

    order_items = []
    for order in Order.objects.select_related("cart").all():
        for cart_item in order.cart.cart_products.select_related("variant__product").all():
            order_items.append(
                OrderItem(
                    order_id=order.order_id,
                    product_id=cart_item.variant.product_id,
                    variant_id=cart_item.variant_id,
                    product_name=cart_item.variant.product.name,
                    color=cart_item.variant.color,
                    size=cart_item.variant.size,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.unit_price,
                    total_price=cart_item.total_price,
                )
            )
    OrderItem.objects.bulk_create(order_items, ignore_conflicts=True)


class Migration(migrations.Migration):

    dependencies = [
        ("carts", "0003_guest_carts_and_ownership_constraints"),
        ("orders", "0001_initial"),
        ("products", "0003_productimage_pending_delete_public_id"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="payment_id",
            field=models.CharField(max_length=255, unique=True),
        ),
        migrations.AddField(
            model_name="order",
            name="date_updated",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("order_item_id", models.AutoField(primary_key=True, serialize=False)),
                ("product_name", models.CharField(max_length=255)),
                ("color", models.CharField(blank=True, max_length=100, null=True)),
                ("size", models.CharField(blank=True, max_length=100, null=True)),
                ("quantity", models.PositiveIntegerField()),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("total_price", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="orders.order",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="order_items",
                        to="products.product",
                    ),
                ),
                (
                    "variant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="order_items",
                        to="products.productvariant",
                    ),
                ),
            ],
            options={"db_table": "order_items"},
        ),
        migrations.RunPython(
            copy_existing_cart_items_to_orders,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="orderitem",
            constraint=models.UniqueConstraint(
                fields=("order", "variant"),
                name="one_order_item_per_variant",
            ),
        ),
    ]
