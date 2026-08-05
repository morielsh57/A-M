from decimal import Decimal

from django.db import IntegrityError, connection, transaction
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from products.models import Product, ProductVariant


class ProductVariantApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roles = {
            role_name: Role.objects.get_or_create(role_name=role_name)[0]
            for role_name in (ADMIN_ROLE, SUPPLIER_ROLE, CUSTOMER_ROLE)
        }
        self.admin = self.create_user("admin@example.com", ADMIN_ROLE)
        self.supplier_user = self.create_user("supplier@example.com", SUPPLIER_ROLE)
        self.supplier = Supplier.objects.create(user=self.supplier_user)
        self.customer = self.create_user("customer@example.com", CUSTOMER_ROLE)
        self.category = Category.objects.create(
            short_id="shirts",
            main_category_name="Shirts",
        )
        self.other_category = Category.objects.create(
            short_id="pants",
            main_category_name="Pants",
        )
        self.product = Product.objects.create(
            catalog_number="TS-100",
            name="Classic Shirt",
            description="Soft classic shirt",
            information="Wash cold",
            price=Decimal("49.99"),
            tags="shirt,cotton",
            fabric="Cotton",
            category=self.category,
            supplier=self.supplier,
        )
        self.black_small = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="S",
            quantity=0,
            images=["/media/products/black-1.jpg"],
        )
        self.black_medium = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=5,
            images=["/media/products/black-1.jpg"],
        )
        self.white_small = ProductVariant.objects.create(
            product=self.product,
            color="White",
            size="S",
            quantity=3,
            images=["/media/products/white-1.jpg"],
        )
        self.other_product = Product.objects.create(
            catalog_number="PT-200",
            name="Tailored Pants",
            price=Decimal("79.99"),
            category=self.other_category,
            supplier=self.supplier,
        )
        ProductVariant.objects.create(
            product=self.other_product,
            color="Navy",
            size="M",
            quantity=4,
            images=["/media/products/navy-1.jpg"],
        )

    def create_user(self, email, role_name):
        return User.objects.create_user(
            email=email,
            name=email.split("@")[0],
            password="A-Strong-Password-2026!",
            role=self.roles[role_name],
            is_active=True,
            is_valid_email=True,
        )

    def authorize(self, user):
        self.client.force_authenticate(user=user)

    def test_variant_is_unique_by_product_color_and_size(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductVariant.objects.create(
                    product=self.product,
                    color="Black",
                    size="S",
                    quantity=1,
                    images=[],
                )

    def test_public_product_list_returns_card_variant_data(self):
        response = self.client.get(
            reverse("product-list"),
            {"category": self.category.category_id},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 1)
        product = data[0]
        self.assertEqual(product["product_id"], self.product.product_id)
        self.assertEqual(product["selected_color"], "Black")
        self.assertEqual(product["selected_variant_id"], self.black_medium.variant_id)
        self.assertEqual(product["images"], ["/media/products/black-1.jpg"])
        self.assertEqual(
            product["colors"],
            [
                {
                    "color": "Black",
                    "variant_id": self.black_medium.variant_id,
                    "in_stock": True,
                    "images": ["/media/products/black-1.jpg"],
                },
                {
                    "color": "White",
                    "variant_id": self.white_small.variant_id,
                    "in_stock": True,
                    "images": ["/media/products/white-1.jpg"],
                },
            ],
        )

    def test_public_product_detail_returns_all_variants(self):
        response = self.client.get(
            reverse("product-detail", kwargs={"product_id": self.product.product_id})
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["catalog_number"], "TS-100")
        self.assertEqual(data["category_id"], self.category.category_id)
        self.assertEqual(data["supplier_id"], self.supplier.supplier_id)
        self.assertEqual(len(data["variants"]), 3)
        self.assertEqual(
            {
                (variant["color"], variant["size"], variant["quantity"])
                for variant in data["variants"]
            },
            {("Black", "S", 0), ("Black", "M", 5), ("White", "S", 3)},
        )

    def test_admin_product_list_returns_grouped_variant_summary(self):
        self.authorize(self.admin)

        response = self.client.get(
            reverse("admin-product-list"),
            {"category": self.category.category_id},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 1)
        product = data[0]
        self.assertEqual(product["colors"], ["Black", "White"])
        self.assertEqual(product["sizes"], ["S", "M"])
        self.assertEqual(product["variant_count"], 3)
        self.assertEqual(product["total_quantity"], 8)

    def test_admin_can_create_product_and_manage_variants(self):
        self.authorize(self.admin)
        create_response = self.client.post(
            reverse("admin-product-list"),
            {
                "catalog_number": "HD-300",
                "name": "Heavy Hoodie",
                "description": "Warm hoodie",
                "information": "Wash cold",
                "price": "99.99",
                "tags": "hoodie",
                "fabric": "Fleece",
                "category_id": self.category.category_id,
                "supplier_id": self.supplier.supplier_id,
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        product_id = create_response.json()["data"]["product_id"]
        variant_response = self.client.post(
            reverse("admin-product-variant-create", kwargs={"product_id": product_id}),
            {
                "color": "Green",
                "size": "L",
                "quantity": 6,
                "images": ["/media/products/green-1.jpg"],
            },
            format="json",
        )

        self.assertEqual(variant_response.status_code, 201)
        variant = variant_response.json()["data"]["variants"][0]
        self.assertEqual(variant["color"], "Green")
        self.assertEqual(variant["quantity"], 6)

        update_response = self.client.patch(
            reverse(
                "admin-product-variant-detail",
                kwargs={"product_id": product_id, "variant_id": variant["variant_id"]},
            ),
            {"quantity": 2},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["data"]["variants"][0]["quantity"], 2)

        delete_response = self.client.delete(
            reverse(
                "admin-product-variant-detail",
                kwargs={"product_id": product_id, "variant_id": variant["variant_id"]},
            )
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(ProductVariant.objects.filter(variant_id=variant["variant_id"]).exists())

    def test_admin_cannot_delete_variant_referenced_by_cart(self):
        self.authorize(self.admin)
        cart = Cart.objects.create(customer=self.customer, total_price=Decimal("49.99"))
        CartProduct.objects.create(
            cart=cart,
            variant=self.black_medium,
            quantity=1,
            unit_price=Decimal("49.99"),
            total_price=Decimal("49.99"),
        )

        response = self.client.delete(
            reverse(
                "admin-product-variant-detail",
                kwargs={
                    "product_id": self.product.product_id,
                    "variant_id": self.black_medium.variant_id,
                },
            )
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("variant_id", response.json()["error"]["details"])


class ProductVariantMigrationTests(TransactionTestCase):
    migrate_from = [("catalogue", "0001_initial")]
    migrate_to = [("products", "0001_initial")]

    def setUp(self):
        super().setUp()
        self.executor = MigrationExecutor(connection)
        self.executor.migrate(self.migrate_from)
        self.old_apps = self.executor.loader.project_state(self.migrate_from).apps

    def tearDown(self):
        self.executor = MigrationExecutor(connection)
        self.executor.migrate(self.executor.loader.graph.leaf_nodes())
        super().tearDown()

    def test_migration_creates_variant_from_existing_product_fields(self):
        Category = self.old_apps.get_model("catalogue", "Category")
        Product = self.old_apps.get_model("catalogue", "Product")
        category = Category.objects.create(
            short_id="migration-shirts",
            main_category_name="Migration Shirts",
        )
        product = Product.objects.create(
            catalog_number="MIG-100",
            name="Migration Shirt",
            price=Decimal("49.99"),
            category=category,
            color="Black",
            size="M",
            quantity=7,
            images='["/media/products/migration-black.jpg"]',
        )

        self.executor = MigrationExecutor(connection)
        self.executor.migrate(self.migrate_to)
        new_apps = self.executor.loader.project_state(self.migrate_to).apps
        ProductVariant = new_apps.get_model("products", "ProductVariant")

        variant = ProductVariant.objects.get(product_id=product.product_id)
        self.assertEqual(variant.color, "Black")
        self.assertEqual(variant.size, "M")
        self.assertEqual(variant.quantity, 7)
        self.assertEqual(variant.images, ["/media/products/migration-black.jpg"])
