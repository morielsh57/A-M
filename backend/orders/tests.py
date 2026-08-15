from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, Role, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from orders.models import Order, OrderItem
from orders.services import create_order_from_cart
from products.models import Product, ProductVariant


class CustomerOrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roles = {
            name: Role.objects.get_or_create(role_name=name)[0]
            for name in (CUSTOMER_ROLE, ADMIN_ROLE)
        }
        self.customer = self.create_user("customer@example.com", CUSTOMER_ROLE)
        self.other_customer = self.create_user("other@example.com", CUSTOMER_ROLE)
        self.admin = self.create_user("admin@example.com", ADMIN_ROLE)
        self.category = Category.objects.create(
            short_id="order-shirts",
            main_category_name="Order Shirts",
        )
        self.product = Product.objects.create(
            catalog_number="ORDER-100",
            name="Order Shirt",
            price=Decimal("30.00"),
            category=self.category,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=5,
        )

    def create_user(self, email, role):
        return User.objects.create_user(
            email=email,
            name=email.split("@")[0],
            password="A-Strong-Password-2026!",
            role=self.roles[role],
            is_active=True,
            is_valid_email=True,
        )

    def authorize(self, user=None):
        self.client.force_authenticate(user=user or self.customer)

    def create_cart(self, customer=None, quantity=2):
        customer = customer or self.customer
        total = self.product.price * quantity
        cart = Cart.objects.create(customer=customer, total_price=total)
        CartProduct.objects.create(
            cart=cart,
            variant=self.variant,
            quantity=quantity,
            unit_price=self.product.price,
            total_price=total,
        )
        return cart

    def checkout(self, payment_id="PAYPAL-ORDER-100", payment_status="COMPLETED"):
        return self.client.post(
            reverse("customer-order-list"),
            {"payment_id": payment_id, "payment_status": payment_status},
            format="json",
        )

    def test_order_is_created_only_after_successful_payment_confirmation(self):
        self.authorize()
        cart = self.create_cart()

        response = self.checkout(payment_status="PENDING")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartProduct.objects.filter(cart=cart).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)

    def test_checkout_snapshots_items_reduces_stock_and_clears_cart(self):
        self.authorize()
        cart = self.create_cart(quantity=2)

        response = self.checkout()

        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertEqual(data["total_price"], "60.00")
        self.assertEqual(data["order_status"], Order.Status.PENDING)
        self.assertEqual(len(data["items"]), 1)
        item = data["items"][0]
        self.assertEqual(item["product_id"], self.product.product_id)
        self.assertEqual(item["variant_id"], self.variant.variant_id)
        self.assertEqual(item["product_name"], "Order Shirt")
        self.assertEqual(item["color"], "Black")
        self.assertEqual(item["size"], "M")
        self.assertEqual(item["quantity"], 2)
        self.assertEqual(item["unit_price"], "30.00")
        self.assertFalse(CartProduct.objects.filter(cart=cart).exists())
        cart.refresh_from_db()
        self.assertEqual(cart.total_price, Decimal("0"))
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 3)

    def test_failed_order_creation_rolls_back_every_change(self):
        self.authorize()
        cart = self.create_cart(quantity=2)

        with patch(
            "orders.services.OrderItem.objects.bulk_create",
            side_effect=RuntimeError("snapshot failure"),
        ):
            with self.assertRaises(RuntimeError):
                create_order_from_cart(self.customer, "PAYPAL-ORDER-100")

        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartProduct.objects.filter(cart=cart, quantity=2).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)

    def test_checkout_rejects_insufficient_stock_without_side_effects(self):
        self.authorize()
        cart = self.create_cart(quantity=4)
        self.variant.quantity = 3
        self.variant.save(update_fields=("quantity",))

        response = self.checkout()

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartProduct.objects.filter(cart=cart, quantity=4).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 3)

    def test_duplicate_checkout_returns_the_existing_order(self):
        self.authorize()
        self.create_cart(quantity=1)

        first = self.checkout(payment_id="IDEMPOTENT-100")
        second = self.checkout(payment_id="IDEMPOTENT-100")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json()["data"]["order_id"], second.json()["data"]["order_id"])
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 4)

    def test_customer_can_view_order_history_and_complete_details(self):
        self.authorize()
        self.create_cart()
        created = self.checkout().json()["data"]

        history = self.client.get(reverse("customer-order-list"))
        detail = self.client.get(
            reverse("customer-order-detail", kwargs={"order_id": created["order_id"]})
        )

        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(history.json()["data"][0]["item_count"], 1)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["data"]["items"][0]["product_name"], "Order Shirt")

    def test_customer_cannot_view_or_cancel_another_customers_order(self):
        self.authorize(self.other_customer)
        self.create_cart(customer=self.other_customer, quantity=1)
        other_order = self.checkout(payment_id="OTHER-ORDER").json()["data"]
        self.authorize(self.customer)

        detail = self.client.get(
            reverse("customer-order-detail", kwargs={"order_id": other_order["order_id"]})
        )
        cancel = self.client.post(
            reverse("customer-order-cancel", kwargs={"order_id": other_order["order_id"]})
        )

        self.assertEqual(detail.status_code, 404)
        self.assertEqual(cancel.status_code, 404)

    def test_cancelling_pending_order_restores_inventory_once(self):
        self.authorize()
        self.create_cart(quantity=2)
        order_id = self.checkout().json()["data"]["order_id"]

        response = self.client.post(
            reverse("customer-order-cancel", kwargs={"order_id": order_id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["order_status"], Order.Status.CANCELLED)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)
        repeated = self.client.post(
            reverse("customer-order-cancel", kwargs={"order_id": order_id})
        )
        self.assertEqual(repeated.status_code, 200)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)

    def test_completed_order_cannot_be_cancelled(self):
        self.authorize()
        self.create_cart(quantity=2)
        order_id = self.checkout().json()["data"]["order_id"]
        order = Order.objects.get(pk=order_id)
        order.order_status = Order.Status.COMPLETED
        order.save(update_fields=("order_status",))

        response = self.client.post(
            reverse("customer-order-cancel", kwargs={"order_id": order_id})
        )

        self.assertEqual(response.status_code, 400)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 3)

    def test_admin_cancellation_uses_transition_rules_and_restores_inventory(self):
        self.authorize()
        self.create_cart(quantity=2)
        order_id = self.checkout().json()["data"]["order_id"]
        self.authorize(self.admin)

        response = self.client.patch(
            reverse("admin-order-detail", kwargs={"order_id": order_id}),
            {"order_status": Order.Status.CANCELLED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)
