from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import CUSTOMER_ROLE, Role, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from payments.models import Payment
from products.models import Product, ProductVariant


@override_settings(PAYPAL_CURRENCY="USD")
class PayPalCheckoutApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        role = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)[0]
        self.customer = User.objects.create_user(
            email="payer@example.com", name="Payer", password="password", role=role
        )
        self.other_customer = User.objects.create_user(
            email="other-payer@example.com",
            name="Other",
            password="password",
            role=role,
        )
        category = Category.objects.create(
            short_id="paypal-products", main_category_name="PayPal Products"
        )
        product = Product.objects.create(
            catalog_number="PAYPAL-1",
            name="Checkout Shirt",
            price=Decimal("19.50"),
            category=category,
        )
        self.variant = ProductVariant.objects.create(
            product=product, color="Black", size="M", quantity=5
        )
        self.cart = Cart.objects.create(
            customer=self.customer, total_price=Decimal("19.50")
        )
        self.cart_product = CartProduct.objects.create(
            cart=self.cart,
            variant=self.variant,
            quantity=2,
            unit_price=Decimal("1.00"),
            total_price=Decimal("2.00"),
        )
        self.client.force_authenticate(self.customer)

    @staticmethod
    def create_response(order_id="PAYPAL-ORDER-1"):
        return {
            "id": order_id,
            "status": "PAYER_ACTION_REQUIRED",
            "links": [
                {"rel": "payer-action", "href": "https://paypal.test/approve"}
            ],
        }

    @staticmethod
    def capture_response(value="39.00", currency="USD", status="COMPLETED"):
        return {
            "id": "PAYPAL-ORDER-1",
            "status": status,
            "purchase_units": [
                {
                    "payments": {
                        "captures": [
                            {
                                "id": "CAPTURE-1",
                                "status": status,
                                "amount": {
                                    "value": value,
                                    "currency_code": currency,
                                },
                            }
                        ]
                    }
                }
            ],
        }

    def create_payment(self, key=None):
        with patch(
            "payments.services.paypal_client.create_order",
            return_value=self.create_response(),
        ):
            return self.client.post(
                reverse("paypal-order-create"),
                {
                    "idempotency_key": str(key or uuid4()),
                    "cart_product_ids": [self.cart_product.cart_product_id],
                },
                format="json",
            )

    @patch("payments.services.paypal_client.create_order")
    def test_create_uses_current_backend_prices_and_saves_snapshot(self, create_order):
        create_order.return_value = self.create_response()

        response = self.client.post(
            reverse("paypal-order-create"),
            {
                "idempotency_key": str(uuid4()),
                "cart_product_ids": [self.cart_product.cart_product_id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["status"], "PAYER_ACTION_REQUIRED")
        self.assertEqual(response.json()["data"]["amount"], "39.00")
        self.assertEqual(response.json()["data"]["approval_url"], "https://paypal.test/approve")
        create_order.assert_called_once()
        self.assertEqual(create_order.call_args.kwargs["amount"], "39.00")
        payment = Payment.objects.get()
        self.assertEqual(payment.items.get().unit_price, Decimal("19.50"))
        self.assertEqual(payment.items.get().quantity, 2)

    @patch("payments.services.paypal_client.create_order")
    def test_create_charges_selected_cart_items_only(self, create_order):
        create_order.return_value = self.create_response()
        second_product = Product.objects.create(
            catalog_number="PAYPAL-2",
            name="Checkout Pants",
            price=Decimal("7.00"),
            category=self.variant.product.category,
        )
        second_variant = ProductVariant.objects.create(
            product=second_product, color="Blue", size="S", quantity=5
        )
        selected_cart_product = CartProduct.objects.create(
            cart=self.cart,
            variant=second_variant,
            quantity=3,
            unit_price=Decimal("7.00"),
            total_price=Decimal("21.00"),
        )

        response = self.client.post(
            reverse("paypal-order-create"),
            {
                "idempotency_key": str(uuid4()),
                "cart_product_ids": [selected_cart_product.cart_product_id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["amount"], "21.00")
        create_order.assert_called_once()
        self.assertEqual(create_order.call_args.kwargs["amount"], "21.00")
        payment_item = Payment.objects.get().items.get()
        self.assertEqual(payment_item.variant_id, second_variant.variant_id)
        self.assertEqual(payment_item.quantity, 3)

    @patch("payments.services.paypal_client.create_order")
    def test_create_is_idempotent(self, create_order):
        create_order.return_value = self.create_response()
        key = uuid4()

        first = self.client.post(
            reverse("paypal-order-create"),
            {
                "idempotency_key": str(key),
                "cart_product_ids": [self.cart_product.cart_product_id],
            },
            format="json",
        )
        second = self.client.post(
            reverse("paypal-order-create"),
            {
                "idempotency_key": str(key),
                "cart_product_ids": [self.cart_product.cart_product_id],
            },
            format="json",
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Payment.objects.count(), 1)
        create_order.assert_called_once()

    def test_empty_cart_and_insufficient_stock_are_rejected_before_paypal(self):
        self.cart.cart_products.all().delete()
        empty = self.client.post(
            reverse("paypal-order-create"),
            {
                "idempotency_key": str(uuid4()),
                "cart_product_ids": [self.cart_product.cart_product_id],
            },
            format="json",
        )
        self.assertEqual(empty.status_code, 400)

        stock_cart_product = CartProduct.objects.create(
            cart=self.cart,
            variant=self.variant,
            quantity=6,
            unit_price=Decimal("19.50"),
            total_price=Decimal("117.00"),
        )
        stock = self.client.post(
            reverse("paypal-order-create"),
            {
                "idempotency_key": str(uuid4()),
                "cart_product_ids": [stock_cart_product.cart_product_id],
            },
            format="json",
        )
        self.assertEqual(stock.status_code, 400)
        self.assertEqual(Payment.objects.count(), 0)

    @patch("payments.services.paypal_client.capture_order")
    def test_capture_verifies_and_persists_provider_payment(self, capture):
        self.create_payment()
        capture.return_value = self.capture_response()

        response = self.client.post(
            reverse(
                "paypal-order-capture",
                kwargs={"provider_order_id": "PAYPAL-ORDER-1"},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["status"], "COMPLETED")
        self.assertEqual(response.json()["data"]["paypal_capture_id"], "CAPTURE-1")

        second = self.client.post(
            reverse(
                "paypal-order-capture",
                kwargs={"provider_order_id": "PAYPAL-ORDER-1"},
            )
        )
        self.assertEqual(second.status_code, 200)
        capture.assert_called_once()

    @patch("payments.services.paypal_client.capture_order")
    def test_capture_rejects_mismatched_amount(self, capture):
        self.create_payment()
        capture.return_value = self.capture_response(value="1.00")

        response = self.client.post(
            reverse(
                "paypal-order-capture",
                kwargs={"provider_order_id": "PAYPAL-ORDER-1"},
            )
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(Payment.objects.get().status, Payment.Status.FAILED)

    def test_customer_cannot_read_or_capture_another_customers_payment(self):
        self.create_payment()
        self.client.force_authenticate(self.other_customer)

        detail = self.client.get(
            reverse(
                "paypal-order-detail",
                kwargs={"provider_order_id": "PAYPAL-ORDER-1"},
            )
        )
        capture = self.client.post(
            reverse(
                "paypal-order-capture",
                kwargs={"provider_order_id": "PAYPAL-ORDER-1"},
            )
        )

        self.assertEqual(detail.status_code, 404)
        self.assertEqual(capture.status_code, 404)
