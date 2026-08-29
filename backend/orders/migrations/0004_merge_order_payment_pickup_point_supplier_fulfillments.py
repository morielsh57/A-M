from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0003_order_payment_pickup_point_fks"),
        ("orders", "0003_supplier_order_fulfillments"),
    ]

    operations = []
