import django.db.models.deletion
from django.db import migrations, models


def set_cart_product_variants(apps, schema_editor):
    CartProduct = apps.get_model("carts", "CartProduct")
    ProductVariant = apps.get_model("products", "ProductVariant")

    for cart_product in CartProduct.objects.all():
        variant = (
            ProductVariant.objects
            .filter(product_id=cart_product.product_id)
            .order_by("variant_id")
            .first()
        )
        if variant is None:
            variant = ProductVariant.objects.create(
                product_id=cart_product.product_id,
                quantity=0,
                images=[],
            )
        cart_product.variant_id = variant.variant_id
        cart_product.save(update_fields=["variant"])


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0001_initial"),
        ("carts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="cartproduct",
            name="variant",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cart_products",
                to="products.productvariant",
            ),
        ),
        migrations.RunPython(
            set_cart_product_variants,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="cartproduct",
            name="variant",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cart_products",
                to="products.productvariant",
            ),
        ),
        migrations.RemoveField(model_name="cartproduct", name="product"),
    ]
