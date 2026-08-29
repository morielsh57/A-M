from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("new_order", "New order"),
                    ("cancelled_order", "Cancelled order"),
                ],
                max_length=255,
            ),
        ),
        migrations.AddConstraint(
            model_name="notification",
            constraint=models.UniqueConstraint(
                fields=("supplier", "order", "type"),
                name="unique_supplier_order_notification_type",
            ),
        ),
    ]
