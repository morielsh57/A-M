from django.db import migrations, models
from django.db.models import Q
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("carts", "0002_cartproduct_variant"),
    ]

    operations = [
        migrations.AlterField(
            model_name="cart",
            name="customer",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="carts",
                to="accounts.user",
            ),
        ),
        migrations.AddField(
            model_name="cart",
            name="guest_id",
            field=models.UUIDField(blank=True, editable=False, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="cart",
            name="date_updated",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddConstraint(
            model_name="cart",
            constraint=models.CheckConstraint(
                condition=(
                    Q(customer__isnull=False, guest_id__isnull=True)
                    | Q(customer__isnull=True, guest_id__isnull=False)
                ),
                name="cart_has_exactly_one_owner",
            ),
        ),
        migrations.AddConstraint(
            model_name="cartproduct",
            constraint=models.UniqueConstraint(
                fields=("cart", "variant"),
                name="one_cart_item_per_variant",
            ),
        ),
    ]
