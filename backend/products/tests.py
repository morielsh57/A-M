from decimal import Decimal
from uuid import uuid4

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, connection, transaction
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from orders.models import Order
from payments.models import Payment
from pickup_points.models import PickUpPoint
from products.models import Product, ProductImage, ProductVariant
from reviews.models import Review


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
        )
        ProductImage.objects.create(
            product=self.product,
            variant=self.black_small,
            public_id="products/black",
            secure_url="https://res.cloudinary.com/am/image/upload/black.jpg",
            is_primary=True,
        )
        self.black_medium = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=5,
        )
        ProductImage.objects.create(
            product=self.product,
            variant=self.black_medium,
            public_id="products/black-medium",
            secure_url="https://res.cloudinary.com/am/image/upload/black.jpg",
        )
        self.white_small = ProductVariant.objects.create(
            product=self.product,
            color="White",
            size="S",
            quantity=3,
        )
        ProductImage.objects.create(
            product=self.product,
            variant=self.white_small,
            public_id="products/white",
            secure_url="https://res.cloudinary.com/am/image/upload/white.jpg",
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
        self.assertEqual(product["images"], ["https://res.cloudinary.com/am/image/upload/black.jpg"])
        self.assertEqual(
            product["colors"],
            [
                {
                    "color": "Black",
                    "variant_id": self.black_medium.variant_id,
                    "in_stock": True,
                    "images": ["https://res.cloudinary.com/am/image/upload/black.jpg"],
                },
                {
                    "color": "White",
                    "variant_id": self.white_small.variant_id,
                    "in_stock": True,
                    "images": ["https://res.cloudinary.com/am/image/upload/white.jpg"],
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
        self.assertTrue(data["in_stock"])
        self.assertEqual(data["total_quantity"], 8)
        self.assertEqual(data["average_rating"], "0.00")
        self.assertEqual(data["rating_count"], 0)

    def test_public_product_detail_returns_404_for_inactive_product(self):
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])

        response = self.client.get(
            reverse("product-detail", kwargs={"product_id": self.product.product_id})
        )

        self.assertEqual(response.status_code, 404)

    def test_public_catalogue_searches_product_keywords(self):
        by_name = self.client.get(reverse("product-list"), {"search": "classic"})
        by_keyword = self.client.get(reverse("product-list"), {"search": "cotton"})
        by_variant_color = self.client.get(reverse("product-list"), {"search": "white"})

        self.assertEqual(
            [item["product_id"] for item in by_name.json()["data"]],
            [self.product.product_id],
        )
        self.assertEqual(
            [item["product_id"] for item in by_keyword.json()["data"]],
            [self.product.product_id],
        )
        self.assertEqual(
            [item["product_id"] for item in by_variant_color.json()["data"]],
            [self.product.product_id],
        )

    def test_public_product_autocomplete_returns_compact_matches(self):
        response = self.client.get(reverse("product-autocomplete"), {"search": "classic"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["data"],
            [
                {
                    "product_id": self.product.product_id,
                    "name": self.product.name,
                    "catalog_number": self.product.catalog_number,
                }
            ],
        )

    def test_public_product_autocomplete_prioritizes_match_fields(self):
        match_fields = (
            {"name": "Needle Name"},
            {"tags": "needle"},
            {"description": "needle"},
            {"information": "needle"},
            {"fabric": "needle"},
            {},
        )
        products = []
        for index, fields in enumerate(match_fields, start=1):
            product = Product.objects.create(
                catalog_number=f"ORDER-{index}",
                name=fields.pop("name", f"Product {index}"),
                price=Decimal("10.00"),
                category=self.category,
                supplier=self.supplier,
                **fields,
            )
            products.append(product)

        ProductVariant.objects.create(
            product=products[-1],
            color="Needle Blue",
            size="M",
            quantity=1,
        )

        response = self.client.get(reverse("product-autocomplete"), {"search": "needle"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["product_id"] for item in response.json()["data"]],
            [product.product_id for product in products],
        )

    def test_public_product_autocomplete_validates_query_and_limit(self):
        missing_search = self.client.get(reverse("product-autocomplete"))
        invalid_limit = self.client.get(
            reverse("product-autocomplete"),
            {"search": "product", "limit": 21},
        )

        self.assertEqual(missing_search.status_code, 400)
        self.assertEqual(invalid_limit.status_code, 400)

    def test_public_product_autocomplete_excludes_inactive_products(self):
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])

        response = self.client.get(reverse("product-autocomplete"), {"search": "classic"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], [])

    def test_public_product_count_returns_matching_count_without_pagination(self):
        response = self.client.get(reverse("product-count"), {"search": "shirt"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"count": 1})
        self.assertNotIn("meta", response.json())

    def test_public_product_count_uses_catalogue_filters(self):
        matching = self.client.get(
            reverse("product-count"),
            {"color": "Black", "size": "M", "in_stock": "true"},
        )
        unavailable = self.client.get(
            reverse("product-count"),
            {"color": "Black", "size": "S", "in_stock": "true"},
        )

        self.assertEqual(matching.status_code, 200)
        self.assertEqual(matching.json()["data"], {"count": 1})
        self.assertEqual(unavailable.status_code, 200)
        self.assertEqual(unavailable.json()["data"], {"count": 0})

    def test_public_catalogue_combines_category_variant_price_and_stock_filters(self):
        response = self.client.get(
            reverse("product-list"),
            {
                "category": self.category.category_id,
                "color": "black",
                "size": "M",
                "min_price": "40.00",
                "max_price": "60.00",
                "in_stock": "true",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["product_id"] for item in response.json()["data"]],
            [self.product.product_id],
        )

    def test_public_catalogue_and_count_filter_by_main_and_subcategory(self):
        subcategory = Category.objects.create(
            short_id="shirts-casual",
            main_category_name="Shirts",
            sub_category_name="Casual",
            parent_category=self.category,
        )
        subcategory_product = Product.objects.create(
            catalog_number="CASUAL-100",
            name="Casual Shirt",
            price=Decimal("39.99"),
            category=subcategory,
            supplier=self.supplier,
        )

        main_products = self.client.get(
            reverse("product-list"),
            {"main_category": self.category.category_id},
        )
        category_products = self.client.get(
            reverse("product-list"),
            {"category": self.category.category_id},
        )
        subcategory_products = self.client.get(
            reverse("product-list"),
            {"main_category": self.category.category_id, "sub_category": subcategory.category_id},
        )
        main_count = self.client.get(
            reverse("product-count"),
            {"main_category": self.category.category_id},
        )
        category_count = self.client.get(
            reverse("product-count"),
            {"category": self.category.category_id},
        )
        subcategory_count = self.client.get(
            reverse("product-count"),
            {"sub_category": subcategory.category_id},
        )

        self.assertEqual(main_products.status_code, 200)
        self.assertEqual(
            {item["product_id"] for item in main_products.json()["data"]},
            {self.product.product_id, subcategory_product.product_id},
        )
        self.assertEqual(category_products.status_code, 200)
        self.assertEqual(
            {item["product_id"] for item in category_products.json()["data"]},
            {self.product.product_id, subcategory_product.product_id},
        )
        self.assertEqual(subcategory_products.status_code, 200)
        self.assertEqual(
            [item["product_id"] for item in subcategory_products.json()["data"]],
            [subcategory_product.product_id],
        )
        self.assertEqual(category_count.status_code, 200)
        self.assertEqual(category_count.json()["data"]["count"], 2)
        self.assertEqual(main_count.json()["data"], {"count": 2})
        self.assertEqual(subcategory_count.json()["data"], {"count": 1})

    def test_variant_filters_must_match_the_same_variant(self):
        response = self.client.get(
            reverse("product-list"),
            {"color": "Black", "size": "S", "in_stock": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], [])

    def test_public_catalogue_filters_out_of_stock_variants(self):
        response = self.client.get(
            reverse("product-list"),
            {"color": "Black", "size": "S", "in_stock": "false"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["product_id"] for item in response.json()["data"]],
            [self.product.product_id],
        )

    def test_public_catalogue_sorts_by_price_and_name(self):
        price_response = self.client.get(reverse("product-list"), {"ordering": "-price"})
        name_response = self.client.get(reverse("product-list"), {"ordering": "name"})

        self.assertEqual(
            [item["product_id"] for item in price_response.json()["data"]],
            [self.other_product.product_id, self.product.product_id],
        )
        self.assertEqual(
            [item["product_id"] for item in name_response.json()["data"]],
            [self.product.product_id, self.other_product.product_id],
        )

    def test_public_catalogue_includes_and_sorts_ratings(self):
        cart = Cart.objects.create(customer=self.customer, total_price=Decimal("49.99"))
        pickup_point = PickUpPoint.objects.create(
            name="Product Review Pickup",
            lat=Decimal("32.0000000"),
            lng=Decimal("34.0000000"),
        )
        payment = Payment.objects.create(
            customer=self.customer,
            cart=cart,
            provider_order_id=f"PRODUCT-PAYPAL-{uuid4()}",
            provider_capture_id=f"PRODUCT-CAPTURE-{uuid4()}",
            idempotency_key=uuid4(),
            status=Payment.Status.COMPLETED,
            amount=Decimal("49.99"),
            currency="USD",
        )
        order = Order.objects.create(
            cart=cart,
            payment=payment,
            pickup_point=pickup_point,
            customer=self.customer,
            total_price=Decimal("49.99"),
            order_status=Order.Status.COMPLETED,
        )
        Review.objects.create(
            order=order,
            product=self.product,
            customer=self.customer,
            review_text="Excellent",
            stars=5,
        )

        response = self.client.get(reverse("product-list"), {"ordering": "-rating"})

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data[0]["product_id"], self.product.product_id)
        self.assertEqual(data[0]["average_rating"], "5.00")
        self.assertEqual(data[0]["rating_count"], 1)

    def test_public_catalogue_validates_filter_values(self):
        invalid_requests = (
            {"min_price": "invalid"},
            {"min_price": "50", "max_price": "20"},
            {"in_stock": "maybe"},
            {"ordering": "unknown"},
            {"category": 999999},
        )

        for query in invalid_requests:
            with self.subTest(query=query):
                response = self.client.get(reverse("product-list"), query)
                self.assertEqual(response.status_code, 400)

    def test_public_catalogue_is_paginated(self):
        response = self.client.get(
            reverse("product-list"),
            {"page": 2, "page_size": 1, "ordering": "name"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["data"]), 1)
        self.assertEqual(response.json()["meta"]["pagination"]["total_items"], 2)

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
        self.assertEqual(product["supplier_id"], self.supplier.supplier_id)
        self.assertEqual(product["supplier_name"], self.supplier_user.name)
        self.assertEqual(product["colors"], ["Black", "White"])
        self.assertEqual(product["sizes"], ["S", "M"])
        self.assertEqual(product["variant_count"], 3)
        self.assertEqual(product["total_quantity"], 8)

    def test_admin_product_list_main_category_includes_subcategory_products(self):
        self.authorize(self.admin)
        subcategory = Category.objects.create(
            short_id="admin-casual-shirts",
            main_category_name="Shirts",
            sub_category_name="Casual",
            parent_category=self.category,
        )
        subcategory_product = Product.objects.create(
            catalog_number="ADMIN-CASUAL-100",
            name="Admin Casual Shirt",
            price=Decimal("39.99"),
            category=subcategory,
            supplier=self.supplier,
        )

        response = self.client.get(
            reverse("admin-product-list"),
            {
                "category": self.category.category_id,
                "page": 1,
                "page_size": 1,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["meta"]["pagination"]["total_items"], 2)
        self.assertEqual(
            {
                item["product_id"]
                for item in self.client.get(
                    reverse("admin-product-list"),
                    {
                        "category": self.category.category_id,
                        "page_size": 20,
                    },
                ).json()["data"]
            },
            {self.product.product_id, subcategory_product.product_id},
        )

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
        uploaded_image = ProductImage.objects.create(
            product_id=product_id,
            public_id="products/heavy-hoodie-green",
            secure_url="https://res.cloudinary.com/am/image/upload/green.jpg",
            width=1200,
            height=1600,
            format="jpg",
            alt_text="Heavy hoodie in green",
            is_primary=True,
        )
        variant_response = self.client.post(
            reverse("admin-product-variant-create", kwargs={"product_id": product_id}),
            {
                "color": "Green",
                "size": "L",
                "quantity": 6,
                "image_ids": [uploaded_image.image_id],
            },
            format="json",
        )

        self.assertEqual(variant_response.status_code, 201)
        variant = variant_response.json()["data"]["variants"][0]
        self.assertEqual(variant["color"], "Green")
        self.assertEqual(variant["quantity"], 6)
        self.assertEqual(
            variant["images"],
            ["https://res.cloudinary.com/am/image/upload/green.jpg"],
        )
        self.assertTrue(
            ProductImage.objects.filter(
                variant_id=variant["variant_id"],
                public_id="products/heavy-hoodie-green",
                is_primary=True,
            ).exists()
        )

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

        ProductImage.objects.filter(public_id="products/heavy-hoodie-green").delete()
        delete_response = self.client.delete(
            reverse(
                "admin-product-variant-detail",
                kwargs={"product_id": product_id, "variant_id": variant["variant_id"]},
            )
        )
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(ProductVariant.objects.filter(variant_id=variant["variant_id"]).exists())

    def test_admin_can_clear_variant_images_with_an_empty_image_ids_list(self):
        self.authorize(self.admin)
        assigned_image = self.black_small.product_images.get()

        response = self.client.patch(
            reverse(
                "admin-product-variant-detail",
                kwargs={
                    "product_id": self.product.product_id,
                    "variant_id": self.black_small.variant_id,
                },
            ),
            {"image_ids": []},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        updated_variant = next(
            variant
            for variant in response.json()["data"]["variants"]
            if variant["variant_id"] == self.black_small.variant_id
        )
        self.assertEqual(updated_variant["images"], [])
        assigned_image.refresh_from_db()
        self.assertIsNone(assigned_image.variant_id)

    def test_variant_patch_without_image_ids_preserves_existing_images(self):
        self.authorize(self.admin)
        assigned_image = self.black_small.product_images.get()

        response = self.client.patch(
            reverse(
                "admin-product-variant-detail",
                kwargs={
                    "product_id": self.product.product_id,
                    "variant_id": self.black_small.variant_id,
                },
            ),
            {"quantity": 4},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        assigned_image.refresh_from_db()
        self.assertEqual(assigned_image.variant_id, self.black_small.variant_id)

    def test_variant_creation_rejects_an_image_from_another_product_atomically(self):
        self.authorize(self.admin)
        other_product_image = ProductImage.objects.create(
            product=self.other_product,
            public_id="products/other-product",
            secure_url="https://res.cloudinary.com/am/image/upload/other.jpg",
        )
        response = self.client.post(
            reverse(
                "admin-product-variant-create",
                kwargs={"product_id": self.product.product_id},
            ),
            {
                "color": "Blue",
                "size": "L",
                "quantity": 2,
                "image_ids": [other_product_image.image_id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            ProductVariant.objects.filter(product=self.product, color="Blue", size="L").exists()
        )

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

    def test_supplier_can_manage_own_products_but_cannot_delete_them(self):
        self.authorize(self.supplier_user)
        create_product_response = self.client.post(
            reverse("admin-product-list"),
            {
                "catalog_number": "SUP-100",
                "name": "Supplier Product",
                "price": "19.99",
                "category_id": self.category.category_id,
                "supplier_id": self.supplier.supplier_id,
            },
            format="json",
        )
        patch_product_response = self.client.patch(
            reverse(
                "admin-product-detail",
                kwargs={"product_id": self.product.product_id},
            ),
            {"name": "Supplier Rename"},
            format="json",
        )
        create_variant_response = self.client.post(
            reverse(
                "admin-product-variant-create",
                kwargs={"product_id": self.product.product_id},
            ),
            {"color": "Red", "size": "S", "quantity": 2},
            format="json",
        )
        patch_variant_response = self.client.patch(
            reverse(
                "admin-product-variant-detail",
                kwargs={
                    "product_id": self.product.product_id,
                    "variant_id": self.black_medium.variant_id,
                },
            ),
            {"quantity": 1},
            format="json",
        )
        list_response = self.client.get(reverse("admin-product-list"))
        delete_product_response = self.client.delete(
            reverse(
                "admin-product-detail",
                kwargs={"product_id": self.product.product_id},
            )
        )
        delete_variant_response = self.client.delete(
            reverse(
                "admin-product-variant-detail",
                kwargs={
                    "product_id": self.product.product_id,
                    "variant_id": self.black_medium.variant_id,
                },
            )
        )

        self.assertEqual(create_product_response.status_code, 201)
        self.assertEqual(patch_product_response.status_code, 200)
        self.assertEqual(create_variant_response.status_code, 201)
        self.assertEqual(patch_variant_response.status_code, 200)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            {item["product_id"] for item in list_response.json()["data"]},
            {
                self.product.product_id,
                self.other_product.product_id,
                create_product_response.json()["data"]["product_id"],
            },
        )
        self.assertEqual(delete_product_response.status_code, 403)
        self.assertEqual(delete_variant_response.status_code, 403)

    def test_supplier_cannot_update_or_add_variants_to_another_supplier_product(self):
        other_supplier_user = self.create_user("other-supplier@example.com", SUPPLIER_ROLE)
        other_supplier = Supplier.objects.create(user=other_supplier_user)
        other_product = Product.objects.create(
            catalog_number="OTHER-100",
            name="Other Supplier Product",
            price=Decimal("39.99"),
            category=self.category,
            supplier=other_supplier,
        )
        other_variant = ProductVariant.objects.create(
            product=other_product,
            color="Blue",
            size="M",
            quantity=4,
        )
        self.authorize(self.supplier_user)

        patch_product_response = self.client.patch(
            reverse(
                "admin-product-detail",
                kwargs={"product_id": other_product.product_id},
            ),
            {"name": "Not Mine"},
            format="json",
        )
        create_variant_response = self.client.post(
            reverse(
                "admin-product-variant-create",
                kwargs={"product_id": other_product.product_id},
            ),
            {"color": "Green", "size": "S", "quantity": 1},
            format="json",
        )
        patch_variant_response = self.client.patch(
            reverse(
                "admin-product-variant-detail",
                kwargs={
                    "product_id": other_product.product_id,
                    "variant_id": other_variant.variant_id,
                },
            ),
            {"quantity": 1},
            format="json",
        )

        self.assertEqual(patch_product_response.status_code, 403)
        self.assertEqual(create_variant_response.status_code, 403)
        self.assertEqual(patch_variant_response.status_code, 403)


class ProductInventoryModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            short_id="model-shirts",
            main_category_name="Shirts",
        )
        self.product = Product.objects.create(
            catalog_number="MODEL-100",
            name="Model Shirt",
            price=Decimal("20.00"),
            category=self.category,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=5,
        )

    def test_negative_product_price_is_rejected(self):
        self.product.price = Decimal("-0.01")
        with self.assertRaises(DjangoValidationError):
            self.product.full_clean()

    def test_negative_variant_quantity_is_rejected(self):
        self.variant.quantity = -1
        with self.assertRaises(DjangoValidationError):
            self.variant.full_clean()

    def test_product_and_variant_can_be_deactivated(self):
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])
        self.variant.is_active = False
        self.variant.save(update_fields=["is_active"])

        self.product.refresh_from_db()
        self.variant.refresh_from_db()
        self.assertFalse(self.product.is_active)
        self.assertFalse(self.variant.is_active)

    def test_inventory_can_be_set_and_adjusted(self):
        ProductVariant.set_stock(self.variant.variant_id, 8)
        updated = ProductVariant.adjust_stock(self.variant.variant_id, -3)
        self.assertEqual(updated.quantity, 5)
        updated = ProductVariant.adjust_stock(self.variant.variant_id, 4)
        self.assertEqual(updated.quantity, 9)

    def test_inventory_cannot_be_reduced_below_zero(self):
        with self.assertRaises(DjangoValidationError):
            ProductVariant.adjust_stock(self.variant.variant_id, -6)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)

    def test_product_supports_multiple_images_and_one_primary(self):
        primary = ProductImage.objects.create(
            product=self.product,
            variant=self.variant,
            public_id="products/model-primary",
            secure_url="https://res.cloudinary.com/am/image/upload/model-primary.jpg",
            is_primary=True,
        )
        secondary = ProductImage.objects.create(
            product=self.product,
            public_id="products/model-secondary",
            secure_url="https://res.cloudinary.com/am/image/upload/model-secondary.jpg",
            display_order=1,
        )

        self.assertEqual(list(self.product.images.all()), [primary, secondary])
        with self.assertRaises(DjangoValidationError):
            ProductImage.objects.create(
                product=self.product,
                public_id="products/another-primary",
                secure_url="https://res.cloudinary.com/am/image/upload/another-primary.jpg",
                is_primary=True,
            )

    def test_image_variant_must_belong_to_same_product(self):
        other_product = Product.objects.create(
            catalog_number="MODEL-200",
            name="Other Model Shirt",
            price=Decimal("25.00"),
            category=self.category,
        )
        with self.assertRaises(DjangoValidationError):
            ProductImage.objects.create(
                product=other_product,
                variant=self.variant,
                public_id="products/wrong-product",
                secure_url="https://res.cloudinary.com/am/image/upload/wrong.jpg",
            )

    def test_inactive_products_and_variants_are_hidden_from_public_api(self):
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])
        response = APIClient().get(reverse("product-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], [])


class ProductVariantMigrationTests(TransactionTestCase):
    migrate_from = [("catalogue", "0001_initial")]
    migrate_to = [("products", "0002_productimage_remove_productvariant_images_and_more")]

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
        ProductImage = new_apps.get_model("products", "ProductImage")

        variant = ProductVariant.objects.get(product_id=product.product_id)
        self.assertEqual(variant.color, "Black")
        self.assertEqual(variant.size, "M")
        self.assertEqual(variant.quantity, 7)
        image = ProductImage.objects.get(variant_id=variant.variant_id)
        self.assertEqual(image.secure_url, "/media/products/migration-black.jpg")
        self.assertTrue(image.is_primary)
