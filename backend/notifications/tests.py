from decimal import Decimal
from uuid import uuid4

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from notifications.models import Notification
from orders.models import Order, OrderItem, SupplierOrderFulfillment
from payments.models import Payment, PaymentItem
from pickup_points.models import PickUpPoint
from products.models import Product, ProductVariant


class SupplierApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        customer_role, _ = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)
        supplier_role, _ = Role.objects.get_or_create(role_name=SUPPLIER_ROLE)
        self.customer = self.create_user("customer@example.com", customer_role)
        self.supplier_user = self.create_user("supplier@example.com", supplier_role)
        self.other_supplier_user = self.create_user(
            "other-supplier@example.com", supplier_role
        )
        self.supplier = Supplier.objects.create(user=self.supplier_user)
        self.other_supplier = Supplier.objects.create(user=self.other_supplier_user)
        self.category = Category.objects.create(
            short_id="supplier-api",
            main_category_name="Supplier API",
        )
        self.product = self.create_product(
            "SUP-100", "Supplier product", self.supplier
        )
        self.other_product = self.create_product(
            "OTHER-100", "Other product", self.other_supplier
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=5,
        )
        self.other_variant = ProductVariant.objects.create(
            product=self.other_product,
            color="Blue",
            size="L",
            quantity=5,
        )
        self.pickup_point = PickUpPoint.objects.create(
            name="Supplier Pickup",
            description="Supplier test pickup description",
            address="Supplier street",
            lat=Decimal("32.0000000"),
            lng=Decimal("34.0000000"),
            is_active=True,
        )

    @staticmethod
    def create_user(email, role):
        return User.objects.create_user(
            email=email,
            name=email.split("@")[0],
            password="A-Strong-Password-2026!",
            role=role,
            is_valid_email=True,
        )

    def create_product(self, catalog_number, name, supplier):
        return Product.objects.create(
            catalog_number=catalog_number,
            name=name,
            price=Decimal("20.00"),
            category=self.category,
            supplier=supplier,
        )

    def authorize(self, user):
        self.client.force_authenticate(user=user)

    def checkout_multi_supplier_order(self):
        cart = Cart.objects.create(customer=self.customer, total_price=Decimal("40.00"))
        first_cart_product = CartProduct.objects.create(
            cart=cart,
            variant=self.variant,
            quantity=1,
            unit_price=Decimal("20.00"),
            total_price=Decimal("20.00"),
        )
        second_cart_product = CartProduct.objects.create(
            cart=cart,
            variant=self.other_variant,
            quantity=1,
            unit_price=Decimal("20.00"),
            total_price=Decimal("20.00"),
        )
        payment = Payment.objects.create(
            customer=self.customer,
            cart=cart,
            provider_order_id=f"SUPPLIER-ORDER-{uuid4()}",
            provider_capture_id=f"SUPPLIER-CAPTURE-{uuid4()}",
            idempotency_key=uuid4(),
            status=Payment.Status.COMPLETED,
            amount=cart.total_price,
            currency="USD",
        )
        PaymentItem.objects.bulk_create(
            [
                PaymentItem(
                    payment=payment,
                    product=cart_product.variant.product,
                    variant=cart_product.variant,
                    product_name=cart_product.variant.product.name,
                    color=cart_product.variant.color,
                    size=cart_product.variant.size,
                    quantity=cart_product.quantity,
                    unit_price=cart_product.unit_price,
                    total_price=cart_product.total_price,
                )
                for cart_product in (first_cart_product, second_cart_product)
            ]
        )
        self.authorize(self.customer)
        response = self.client.post(
            reverse("customer-order-list"),
            {
                "payment_id": payment.payment_id,
                "pickup_point_id": self.pickup_point.pick_up_point_id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        return Order.objects.get(pk=response.json()["data"]["order_id"])

    def test_supplier_product_endpoints_are_scoped_and_protect_ownership(self):
        self.authorize(self.supplier_user)

        listing = self.client.get(reverse("supplier-product-list"))
        own_detail = self.client.get(
            reverse("supplier-product-detail", kwargs={"product_id": self.product.pk})
        )
        other_detail = self.client.get(
            reverse(
                "supplier-product-detail",
                kwargs={"product_id": self.other_product.pk},
            )
        )
        update = self.client.patch(
            reverse("supplier-product-detail", kwargs={"product_id": self.product.pk}),
            {"name": "Updated supplier product"},
            format="json",
        )
        ownership_change = self.client.patch(
            reverse("supplier-product-detail", kwargs={"product_id": self.product.pk}),
            {"supplier_id": self.other_supplier.pk},
            format="json",
        )

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(
            [item["product_id"] for item in listing.json()["data"]],
            [self.product.pk],
        )
        self.assertEqual(own_detail.status_code, 200)
        self.assertEqual(other_detail.status_code, 404)
        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.json()["data"]["name"], "Updated supplier product")
        self.assertEqual(ownership_change.status_code, 400)

    def test_supplier_endpoints_require_authentication_and_supplier_role(self):
        endpoints = (
            reverse("supplier-product-list"),
            reverse("supplier-order-list"),
            reverse("supplier-notification-list"),
        )
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint, role="unauthenticated"):
                self.client.force_authenticate(user=None)
                self.assertEqual(self.client.get(endpoint).status_code, 401)
            with self.subTest(endpoint=endpoint, role="customer"):
                self.authorize(self.customer)
                self.assertEqual(self.client.get(endpoint).status_code, 403)

    def test_checkout_creates_one_notification_for_each_supplier(self):
        order = self.checkout_multi_supplier_order()

        self.assertEqual(
            Notification.objects.filter(
                order=order,
                type=Notification.Type.NEW_ORDER,
            ).count(),
            2,
        )
        self.supplier.refresh_from_db()
        self.other_supplier.refresh_from_db()
        self.assertEqual(self.supplier.unread_counter, 1)
        self.assertEqual(self.other_supplier.unread_counter, 1)

    def test_supplier_order_api_returns_only_owned_items_and_no_private_data(self):
        order = self.checkout_multi_supplier_order()
        self.authorize(self.supplier_user)

        listing = self.client.get(reverse("supplier-order-list"))
        detail = self.client.get(
            reverse("supplier-order-detail", kwargs={"order_id": order.pk})
        )

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(detail.status_code, 200)
        data = detail.json()["data"]
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["product_id"], self.product.pk)
        self.assertEqual(data["supplier_total_price"], 20.0)
        self.assertNotIn("customer_id", data)
        self.assertNotIn("payment_id", data)
        self.assertNotIn("total_price", data)

    def test_supplier_statuses_complete_independently_then_complete_order(self):
        order = self.checkout_multi_supplier_order()
        self.authorize(self.supplier_user)

        first = self.client.patch(
            reverse("supplier-order-status", kwargs={"order_id": order.pk}),
            {"order_status": SupplierOrderFulfillment.Status.COMPLETED},
            format="json",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(
            first.json()["data"]["order_status"],
            SupplierOrderFulfillment.Status.COMPLETED,
        )
        order.refresh_from_db()
        self.assertEqual(order.order_status, Order.Status.PENDING)
        self.authorize(self.other_supplier_user)
        other_detail = self.client.get(
            reverse("supplier-order-detail", kwargs={"order_id": order.pk})
        )
        self.assertEqual(
            other_detail.json()["data"]["order_status"],
            SupplierOrderFulfillment.Status.PENDING,
        )

        second = self.client.patch(
            reverse("supplier-order-status", kwargs={"order_id": order.pk}),
            {"order_status": SupplierOrderFulfillment.Status.COMPLETED},
            format="json",
        )

        self.assertEqual(second.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.order_status, Order.Status.COMPLETED)

    def test_unauthorized_supplier_status_transitions_are_rejected(self):
        order = self.checkout_multi_supplier_order()
        third_user = self.create_user(
            "unrelated-supplier@example.com",
            self.supplier_user.role,
        )
        Supplier.objects.create(user=third_user)

        self.authorize(self.customer)
        customer_change = self.client.patch(
            reverse("supplier-order-status", kwargs={"order_id": order.pk}),
            {"order_status": SupplierOrderFulfillment.Status.COMPLETED},
            format="json",
        )
        self.authorize(third_user)
        unrelated_change = self.client.patch(
            reverse("supplier-order-status", kwargs={"order_id": order.pk}),
            {"order_status": SupplierOrderFulfillment.Status.COMPLETED},
            format="json",
        )
        self.authorize(self.supplier_user)
        cancellation_attempt = self.client.patch(
            reverse("supplier-order-status", kwargs={"order_id": order.pk}),
            {"order_status": SupplierOrderFulfillment.Status.CANCELLED},
            format="json",
        )

        self.assertEqual(customer_change.status_code, 403)
        self.assertEqual(unrelated_change.status_code, 404)
        self.assertEqual(cancellation_attempt.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.order_status, Order.Status.PENDING)

    def test_cancellation_notifications_are_idempotent(self):
        order = self.checkout_multi_supplier_order()
        self.authorize(self.customer)

        first = self.client.post(
            reverse("customer-order-cancel", kwargs={"order_id": order.pk})
        )
        second = self.client.post(
            reverse("customer-order-cancel", kwargs={"order_id": order.pk})
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Notification.objects.filter(order=order).count(), 4)
        self.supplier.refresh_from_db()
        self.other_supplier.refresh_from_db()
        self.assertEqual(self.supplier.unread_counter, 2)
        self.assertEqual(self.other_supplier.unread_counter, 2)
        self.assertFalse(
            SupplierOrderFulfillment.objects.filter(order=order).exclude(
                status=SupplierOrderFulfillment.Status.CANCELLED
            ).exists()
        )

    def test_supplier_can_list_and_mark_only_own_notifications_read(self):
        order = self.checkout_multi_supplier_order()
        own_notification = Notification.objects.get(
            supplier=self.supplier,
            order=order,
            type=Notification.Type.NEW_ORDER,
        )
        other_notification = Notification.objects.get(
            supplier=self.other_supplier,
            order=order,
            type=Notification.Type.NEW_ORDER,
        )
        self.authorize(self.supplier_user)

        listing = self.client.get(reverse("supplier-notification-list"))
        unread_count = self.client.get(reverse("supplier-notification-unread-count"))
        first_read = self.client.post(
            reverse(
                "supplier-notification-read",
                kwargs={"notification_id": own_notification.pk},
            )
        )
        repeated_read = self.client.post(
            reverse(
                "supplier-notification-read",
                kwargs={"notification_id": own_notification.pk},
            )
        )
        other_read = self.client.post(
            reverse(
                "supplier-notification-read",
                kwargs={"notification_id": other_notification.pk},
            )
        )

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(unread_count.json()["data"]["unread_count"], 1)
        self.assertEqual(first_read.status_code, 200)
        self.assertTrue(first_read.json()["data"]["is_read"])
        self.assertEqual(repeated_read.status_code, 200)
        self.assertEqual(other_read.status_code, 404)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.unread_counter, 0)

    def test_mark_all_read_updates_notifications_and_counter(self):
        order = self.checkout_multi_supplier_order()
        self.authorize(self.customer)
        self.client.post(reverse("customer-order-cancel", kwargs={"order_id": order.pk}))
        self.authorize(self.supplier_user)

        response = self.client.post(reverse("supplier-notification-read-all"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["marked_read"], 2)
        self.assertFalse(
            Notification.objects.filter(supplier=self.supplier, is_read=False).exists()
        )
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.unread_counter, 0)
