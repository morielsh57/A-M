from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import CUSTOMER_ROLE, Role, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from products.models import Product, ProductVariant


class CartVariantApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer_role = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)[0]
        self.customer = User.objects.create_user(
            email="customer@example.com",
            name="customer",
            password="A-Strong-Password-2026!",
            role=self.customer_role,
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
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=3,
            images=["/media/products/cart-black.jpg"],
        )

    def test_customer_can_add_variant_to_cart(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            reverse("cart-items"),
            {"variant_id": self.variant.variant_id, "quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertEqual(data["variant_id"], self.variant.variant_id)
        self.assertEqual(data["product_id"], self.product.product_id)
        self.assertEqual(data["quantity"], 2)
        self.assertEqual(Cart.objects.get(customer=self.customer).total_price, Decimal("50.00"))
        self.assertEqual(CartProduct.objects.get().variant, self.variant)

    def test_cart_rejects_quantity_above_variant_quantity(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            reverse("cart-items"),
            {"variant_id": self.variant.variant_id, "quantity": 4},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("quantity", response.json()["error"]["details"])

# Create your tests here.
