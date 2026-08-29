import django.db.models.deletion
from django.db import migrations, models


def link_existing_payments(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    Payment = apps.get_model("payments", "Payment")

    for order in Order.objects.all():
        legacy_payment_id = str(order.legacy_payment_id or "").strip()
        if not legacy_payment_id:
            continue

        payment = None
        if legacy_payment_id.isdigit():
            payment = Payment.objects.filter(
                payment_id=int(legacy_payment_id),
                customer_id=order.customer_id,
            ).first()
        if payment is None:
            payment = Payment.objects.filter(
                provider_order_id=legacy_payment_id,
                customer_id=order.customer_id,
            ).first()

        if payment is not None:
            order.payment_id = payment.payment_id
            order.save(update_fields=("payment",))


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_items_and_payment_idempotency"),
        ("payments", "0002_alter_payment_status"),
        ("pickup_points", "0002_pickuppoint_is_active"),
    ]

    operations = [
        migrations.RenameField(
            model_name="order",
            old_name="payment_id",
            new_name="legacy_payment_id",
        ),
        migrations.AddField(
            model_name="order",
            name="payment",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="order",
                to="payments.payment",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="pickup_point",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="orders",
                to="pickup_points.pickuppoint",
            ),
        ),
        migrations.RunPython(link_existing_payments, reverse_code=migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="order",
            name="legacy_payment_id",
        ),
    ]
