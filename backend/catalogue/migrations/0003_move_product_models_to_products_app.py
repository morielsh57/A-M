from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("catalogue", "0002_product_variants"),
        ("products", "0001_initial"),
        ("carts", "0002_cartproduct_variant"),
        ("reviews", "0002_review_product_to_products"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.DeleteModel(name="ProductVariant"),
                migrations.DeleteModel(name="Product"),
            ],
        ),
    ]
