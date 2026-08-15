from decimal import Decimal
from uuid import UUID

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, Role, User
from carts.models import Cart, CartProduct
from carts.services import GUEST_CART_HEADER
from catalogue.models import Category
from products.models import Product, ProductVariant


class CartApiTests(TestCase):
    password = "A-Strong-Password-2026!"

    def setUp(self):
        self.client = APIClient()
        self.customer_role = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)[0]
        self.admin_role = Role.objects.get_or_create(role_name=ADMIN_ROLE)[0]
        self.customer = self.create_customer("customer@example.com")
        self.other_customer = self.create_customer("other@example.com")
        self.admin = User.objects.create_user(
            email="admin@example.com",
            name="admin",
            password=self.password,
            role=self.admin_role,
            is_active=True,
            is_valid_email=True,
        )
        self.category = Category.objects.create(
            short_id="cart-shirts",
            main_category_name="Cart Shirts",
        )
        self.product = Product.objects.create(
            catalog_number="CART-100",
            name="Cart Shirt",
            price=Decimal("25.00"),
            category=self.category,
        )
        self.black_medium = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=5,
        )
        self.blue_large = ProductVariant.objects.create(
            product=self.product,
            color="Blue",
            size="L",
            quantity=2,
        )

    def create_customer(self, email):
        return User.objects.create_user(
            email=email,
            name=email.split("@")[0],
            password=self.password,
            role=self.customer_role,
            is_active=True,
            is_valid_email=True,
        )

    def authorize(self, user=None):
        self.client.force_authenticate(user=user or self.customer)

    def create_guest_cart(self):
        response = self.client.post(reverse("guest-cart-create"))
        self.assertEqual(response.status_code, 201)
        return response.json()["data"]

    @override_settings(CORS_ALLOWED_ORIGINS=["http://localhost:3001"])
    def test_guest_cart_header_is_allowed_by_cors_preflight(self):
        response = self.client.options(
            reverse("cart-items"),
            HTTP_ORIGIN="http://localhost:3001",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type,x-guest-cart-id",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Access-Control-Allow-Origin"],
            "http://localhost:3001",
        )
        self.assertIn(
            "x-guest-cart-id",
            response["Access-Control-Allow-Headers"],
        )

    def add_guest_item(self, guest_cart_id, variant, quantity):
        return self.client.post(
            reverse("cart-items"),
            {"variant_id": variant.variant_id, "quantity": quantity},
            format="json",
            **{"HTTP_X_GUEST_CART_ID": guest_cart_id},
        )

    def test_authenticated_customer_has_a_saved_cart(self):
        self.authorize()

        first = self.client.get(reverse("cart-detail"))
        second = self.client.get(reverse("cart-detail"))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()["data"]["cart_id"], second.json()["data"]["cart_id"])
        self.assertEqual(Cart.objects.filter(customer=self.customer).count(), 1)
        self.assertIsNone(first.json()["data"]["guest_cart_id"])

    def test_authenticated_admin_has_a_saved_cart(self):
        self.authorize(self.admin)

        first = self.client.get(reverse("cart-detail"))
        second = self.client.get(reverse("cart-detail"))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()["data"]["cart_id"], second.json()["data"]["cart_id"])
        self.assertEqual(Cart.objects.filter(customer=self.admin).count(), 1)
        self.assertIsNone(first.json()["data"]["guest_cart_id"])

    def test_guest_cart_identifier_is_secure_and_unique(self):
        first = self.create_guest_cart()
        second = self.create_guest_cart()

        first_id = UUID(first["guest_cart_id"])
        second_id = UUID(second["guest_cart_id"])
        self.assertEqual(first_id.version, 4)
        self.assertEqual(second_id.version, 4)
        self.assertNotEqual(first_id, second_id)

    def test_guest_can_add_variant_and_backend_calculates_total(self):
        guest = self.create_guest_cart()

        response = self.add_guest_item(guest["guest_cart_id"], self.black_medium, 2)

        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertEqual(data["total_price"], "50.00")
        self.assertEqual(data["items"][0]["color"], "Black")
        self.assertEqual(data["items"][0]["size"], "M")
        self.assertEqual(data["items"][0]["quantity"], 2)

    def test_adding_duplicate_variant_combines_quantities(self):
        self.authorize()
        payload = {"variant_id": self.black_medium.variant_id, "quantity": 1}

        self.client.post(reverse("cart-items"), payload, format="json")
        response = self.client.post(reverse("cart-items"), payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["items"][0]["quantity"], 2)
        self.assertEqual(CartProduct.objects.count(), 1)

    def test_cart_item_quantity_can_be_updated_and_removed(self):
        self.authorize()
        added = self.client.post(
            reverse("cart-items"),
            {"variant_id": self.black_medium.variant_id, "quantity": 1},
            format="json",
        ).json()["data"]
        item_id = added["items"][0]["cart_product_id"]

        updated = self.client.patch(
            reverse("cart-item-detail", kwargs={"cart_product_id": item_id}),
            {"quantity": 3},
            format="json",
        )
        removed = self.client.delete(
            reverse("cart-item-detail", kwargs={"cart_product_id": item_id})
        )

        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["data"]["total_price"], "75.00")
        self.assertEqual(removed.status_code, 200)
        self.assertEqual(removed.json()["data"]["items"], [])
        self.assertEqual(removed.json()["data"]["total_price"], "0.00")

    def test_add_and_update_reject_quantities_above_stock(self):
        self.authorize()
        add_response = self.client.post(
            reverse("cart-items"),
            {"variant_id": self.black_medium.variant_id, "quantity": 6},
            format="json",
        )
        valid = self.client.post(
            reverse("cart-items"),
            {"variant_id": self.black_medium.variant_id, "quantity": 1},
            format="json",
        ).json()["data"]
        update_response = self.client.patch(
            reverse(
                "cart-item-detail",
                kwargs={"cart_product_id": valid["items"][0]["cart_product_id"]},
            ),
            {"quantity": 6},
            format="json",
        )

        self.assertEqual(add_response.status_code, 400)
        self.assertEqual(update_response.status_code, 400)
        self.assertIn("quantity", add_response.json()["error"]["details"])

    def test_customer_cannot_access_another_customers_cart_item(self):
        other_cart = Cart.objects.create(customer=self.other_customer, total_price=Decimal("25"))
        other_item = CartProduct.objects.create(
            cart=other_cart,
            variant=self.black_medium,
            quantity=1,
            unit_price=Decimal("25"),
            total_price=Decimal("25"),
        )
        self.authorize()

        response = self.client.patch(
            reverse("cart-item-detail", kwargs={"cart_product_id": other_item.cart_product_id}),
            {"quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        other_item.refresh_from_db()
        self.assertEqual(other_item.quantity, 1)

    def test_guest_identifier_cannot_access_a_different_guest_cart(self):
        first = self.create_guest_cart()
        second = self.create_guest_cart()
        added = self.add_guest_item(first["guest_cart_id"], self.black_medium, 1).json()["data"]

        response = self.client.delete(
            reverse(
                "cart-item-detail",
                kwargs={"cart_product_id": added["items"][0]["cart_product_id"]},
            ),
            **{"HTTP_X_GUEST_CART_ID": second["guest_cart_id"]},
        )

        self.assertEqual(response.status_code, 404)

    def test_merge_combines_duplicate_variants_and_caps_quantity_at_stock(self):
        customer_cart = Cart.objects.create(customer=self.customer, total_price=Decimal("100"))
        CartProduct.objects.create(
            cart=customer_cart,
            variant=self.black_medium,
            quantity=4,
            unit_price=Decimal("25"),
            total_price=Decimal("100"),
        )
        guest = self.create_guest_cart()
        self.add_guest_item(guest["guest_cart_id"], self.black_medium, 3)
        self.add_guest_item(guest["guest_cart_id"], self.blue_large, 1)
        self.authorize()

        response = self.client.post(
            reverse("cart-merge"),
            {"guest_cart_id": guest["guest_cart_id"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        items = {item["variant_id"]: item for item in response.json()["data"]["items"]}
        self.assertEqual(items[self.black_medium.variant_id]["quantity"], 5)
        self.assertEqual(items[self.blue_large.variant_id]["quantity"], 1)
        self.assertEqual(response.json()["data"]["total_price"], "150.00")
        self.assertFalse(Cart.objects.filter(guest_id=guest["guest_cart_id"]).exists())

    def test_guest_cart_is_merged_automatically_after_login(self):
        guest = self.create_guest_cart()
        self.add_guest_item(guest["guest_cart_id"], self.blue_large, 2)

        response = self.client.post(
            reverse("login"),
            {
                "email": self.customer.email,
                "password": self.password,
                "guest_cart_id": guest["guest_cart_id"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        cart = Cart.objects.get(customer=self.customer)
        self.assertEqual(cart.cart_products.get().quantity, 2)
        self.assertFalse(Cart.objects.filter(guest_id=guest["guest_cart_id"]).exists())
