from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from orders.models import Order, OrderItem, SupplierOrderFulfillment
from orders.services import create_order_from_cart
from payments.models import Payment, PaymentItem
from pickup_points.models import PickUpPoint
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
        self.authorized_user = self.customer
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
        self.pickup_point = PickUpPoint.objects.create(
            name="Central Pickup",
            lat=Decimal("32.0000000"),
            lng=Decimal("34.0000000"),
            address="Central street",
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
        self.authorized_user = user or self.customer
        self.client.force_authenticate(user=self.authorized_user)

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

    def create_payment(self, cart, customer=None, status=Payment.Status.COMPLETED, cart_products=None):
        cart_products = list(
            cart_products
            if cart_products is not None
            else cart.cart_products.select_related("variant__product").order_by("cart_product_id")
        )
        amount = sum((item.total_price for item in cart_products), Decimal("0"))
        payment = Payment.objects.create(
            customer=customer or cart.customer,
            cart=cart,
            provider_order_id=f"PAYPAL-ORDER-{uuid4()}",
            provider_capture_id=f"CAPTURE-{uuid4()}" if status == Payment.Status.COMPLETED else None,
            idempotency_key=uuid4(),
            status=status,
            amount=amount,
            currency="USD",
        )
        PaymentItem.objects.bulk_create(
            [
                PaymentItem(
                    payment=payment,
                    product=item.variant.product,
                    variant=item.variant,
                    product_name=item.variant.product.name,
                    color=item.variant.color,
                    size=item.variant.size,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price,
                )
                for item in cart_products
            ]
        )
        return payment

    def checkout(self, payment_id=None, pickup_point_id=None):
        if payment_id is None:
            cart = Cart.objects.filter(
                customer=self.authorized_user,
                orders__isnull=True,
            ).order_by("-date_created").first()
            payment_id = self.create_payment(cart).payment_id

        return self.client.post(
            reverse("customer-order-list"),
            {
                "payment_id": payment_id,
                "pickup_point_id": pickup_point_id or self.pickup_point.pick_up_point_id,
            },
            format="json",
        )

    def test_order_is_created_only_after_successful_payment_confirmation(self):
        self.authorize()
        cart = self.create_cart()
        payment = self.create_payment(cart, status=Payment.Status.CREATED)

        response = self.checkout(payment_id=payment.payment_id)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartProduct.objects.filter(cart=cart).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)

    def test_order_requires_existing_customer_owned_payment(self):
        self.authorize()
        cart = self.create_cart()
        other_payment = self.create_payment(cart, customer=self.other_customer)

        missing_response = self.checkout(payment_id=999999)
        other_response = self.checkout(payment_id=other_payment.payment_id)

        self.assertEqual(missing_response.status_code, 400)
        self.assertEqual(other_response.status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_order_requires_active_pickup_point(self):
        self.authorize()
        cart = self.create_cart()
        payment = self.create_payment(cart)
        inactive_pickup = PickUpPoint.objects.create(
            name="Inactive Pickup",
            lat=Decimal("32.1000000"),
            lng=Decimal("34.1000000"),
            is_active=False,
        )

        missing_response = self.checkout(payment_id=payment.payment_id, pickup_point_id=999999)
        inactive_response = self.checkout(
            payment_id=payment.payment_id,
            pickup_point_id=inactive_pickup.pick_up_point_id,
        )

        self.assertEqual(missing_response.status_code, 400)
        self.assertEqual(inactive_response.status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_checkout_snapshots_items_reduces_stock_and_clears_cart(self):
        self.authorize()
        cart = self.create_cart(quantity=2)

        response = self.checkout()

        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertEqual(data["total_price"], "60.00")
        self.assertEqual(data["order_status"], Order.Status.PENDING)
        self.assertEqual(data["pickup_point_id"], self.pickup_point.pick_up_point_id)
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

    def test_checkout_orders_selected_payment_items_and_keeps_remaining_cart(self):
        self.authorize()
        cart = self.create_cart(quantity=2)
        selected_cart_product = cart.cart_products.get()
        second_product = Product.objects.create(
            catalog_number="ORDER-200",
            name="Remaining Pants",
            price=Decimal("15.00"),
            category=self.category,
        )
        second_variant = ProductVariant.objects.create(
            product=second_product,
            color="Blue",
            size="S",
            quantity=5,
        )
        remaining_cart_product = CartProduct.objects.create(
            cart=cart,
            variant=second_variant,
            quantity=1,
            unit_price=Decimal("15.00"),
            total_price=Decimal("15.00"),
        )
        payment = self.create_payment(cart, cart_products=[selected_cart_product])

        response = self.checkout(payment_id=payment.payment_id)

        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertEqual(data["total_price"], "60.00")
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["variant_id"], self.variant.variant_id)
        self.assertFalse(CartProduct.objects.filter(pk=selected_cart_product.pk).exists())
        active_cart = Cart.objects.filter(customer=self.customer, orders__isnull=True).get()
        remaining_item = active_cart.cart_products.get()
        self.assertEqual(remaining_item.variant_id, remaining_cart_product.variant_id)
        self.assertEqual(active_cart.total_price, Decimal("15.00"))

    def test_failed_order_creation_rolls_back_every_change(self):
        self.authorize()
        cart = self.create_cart(quantity=2)

        with patch(
            "orders.services.OrderItem.objects.bulk_create",
            side_effect=RuntimeError("snapshot failure"),
        ):
            with self.assertRaises(RuntimeError):
                payment = self.create_payment(cart)
                create_order_from_cart(
                    self.customer,
                    payment.payment_id,
                    self.pickup_point.pick_up_point_id,
                )

        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartProduct.objects.filter(cart=cart, quantity=2).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 5)

    def test_checkout_rejects_insufficient_stock_without_side_effects(self):
        self.authorize()
        cart = self.create_cart(quantity=4)
        payment = self.create_payment(cart)
        self.variant.quantity = 3
        self.variant.save(update_fields=("quantity",))

        response = self.checkout(payment_id=payment.payment_id)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartProduct.objects.filter(cart=cart, quantity=4).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 3)

    def test_duplicate_checkout_returns_the_existing_order(self):
        self.authorize()
        cart = self.create_cart(quantity=1)
        payment = self.create_payment(cart)

        first = self.checkout(payment_id=payment.payment_id)
        second = self.checkout(payment_id=payment.payment_id)

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
        other_order = self.checkout().json()["data"]
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

    def test_admin_can_change_order_status_anytime_and_inventory_stays_consistent(self):
        self.authorize()
        self.create_cart(quantity=2)
        order_id = self.checkout().json()["data"]["order_id"]
        self.authorize(self.admin)

        cancel_response = self.client.patch(
            reverse("admin-order-detail", kwargs={"order_id": order_id}),
            {"order_status": Order.Status.CANCELLED},
            format="json",
        )
        self.variant.refresh_from_db()
        stock_after_cancel = self.variant.quantity
        complete_response = self.client.patch(
            reverse("admin-order-detail", kwargs={"order_id": order_id}),
            {"order_status": Order.Status.COMPLETED},
            format="json",
        )
        self.variant.refresh_from_db()
        stock_after_complete = self.variant.quantity
        pending_response = self.client.patch(
            reverse("admin-order-detail", kwargs={"order_id": order_id}),
            {"order_status": Order.Status.PENDING},
            format="json",
        )

        self.assertEqual(cancel_response.status_code, 200)
        self.assertEqual(complete_response.status_code, 200)
        self.assertEqual(pending_response.status_code, 200)
        self.assertEqual(cancel_response.json()["data"]["order_status"], Order.Status.CANCELLED)
        self.assertEqual(complete_response.json()["data"]["order_status"], Order.Status.COMPLETED)
        self.assertEqual(pending_response.json()["data"]["order_status"], Order.Status.PENDING)
        self.assertEqual(stock_after_cancel, 5)
        self.assertEqual(stock_after_complete, 3)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.quantity, 3)


class AdminSupplierOrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roles = {
            name: Role.objects.get_or_create(role_name=name)[0]
            for name in (CUSTOMER_ROLE, ADMIN_ROLE, SUPPLIER_ROLE)
        }
        self.admin = self.create_user("admin-orders@example.com", ADMIN_ROLE)
        self.customer = self.create_user("customer-orders@example.com", CUSTOMER_ROLE)
        self.supplier_user = self.create_user("supplier-orders@example.com", SUPPLIER_ROLE)
        self.other_supplier_user = self.create_user("other-supplier-orders@example.com", SUPPLIER_ROLE)
        self.supplier = Supplier.objects.create(user=self.supplier_user)
        self.other_supplier = Supplier.objects.create(user=self.other_supplier_user)
        self.category = Category.objects.create(
            short_id="admin-orders",
            main_category_name="Admin Orders",
        )
        self.pickup_point = PickUpPoint.objects.create(
            name="Admin Orders Pickup",
            lat=Decimal("32.0000000"),
            lng=Decimal("34.0000000"),
            address="Orders street",
        )
        self.product = self.create_product("ADMIN-ORDER-100", "Supplier Coat", self.supplier)
        self.other_product = self.create_product(
            "ADMIN-ORDER-200",
            "Other Supplier Hat",
            self.other_supplier,
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
            size="S",
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

    def create_product(self, catalog_number, name, supplier):
        return Product.objects.create(
            catalog_number=catalog_number,
            name=name,
            price=Decimal("20.00"),
            category=self.category,
            supplier=supplier,
        )

    def create_order(self, variant, *, customer=None, status=Order.Status.PENDING):
        customer = customer or self.customer
        cart = Cart.objects.create(customer=customer, total_price=Decimal("20.00"))
        order = Order.objects.create(
            cart=cart,
            customer=customer,
            pickup_point=self.pickup_point,
            total_price=Decimal("20.00"),
            order_status=status,
        )
        OrderItem.objects.create(
            order=order,
            product=variant.product,
            variant=variant,
            product_name=variant.product.name,
            color=variant.color,
            size=variant.size,
            quantity=1,
            unit_price=Decimal("20.00"),
            total_price=Decimal("20.00"),
        )
        SupplierOrderFulfillment.objects.create(
            order=order,
            supplier=variant.product.supplier,
            status=status,
        )
        return order

    def authorize(self, user):
        self.client.force_authenticate(user=user)

    def test_admin_orders_endpoint_returns_all_orders(self):
        first_order = self.create_order(self.variant)
        second_order = self.create_order(self.other_variant)
        self.authorize(self.admin)

        response = self.client.get(reverse("admin-order-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["meta"]["pagination"]["total_items"], 2)
        self.assertEqual(
            {order["order_id"] for order in response.json()["data"]},
            {first_order.pk, second_order.pk},
        )
        self.assertIn("customer_email", response.json()["data"][0])

    def test_supplier_uses_admin_orders_endpoint_but_only_sees_related_orders(self):
        own_order = self.create_order(self.variant)
        other_order = self.create_order(self.other_variant)
        self.authorize(self.supplier_user)

        listing = self.client.get(reverse("admin-order-list"))
        own_detail = self.client.get(
            reverse("admin-order-detail", kwargs={"order_id": own_order.pk})
        )
        other_detail = self.client.get(
            reverse("admin-order-detail", kwargs={"order_id": other_order.pk})
        )

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["meta"]["pagination"]["total_items"], 1)
        data = listing.json()["data"][0]
        self.assertEqual(data["order_id"], own_order.pk)
        self.assertEqual(data["item_count"], 1)
        self.assertEqual(data["supplier_total_price"], 20.0)
        self.assertNotIn("customer_email", data)
        self.assertNotIn("payment_id", data)
        self.assertEqual(own_detail.status_code, 200)
        self.assertEqual(other_detail.status_code, 404)

    def test_admin_orders_search_and_status_filter_work(self):
        pending_order = self.create_order(self.variant)
        self.create_order(self.other_variant, status=Order.Status.COMPLETED)
        self.authorize(self.admin)

        status_response = self.client.get(
            reverse("admin-order-list"),
            {"status": Order.Status.PENDING},
        )
        search_response = self.client.get(
            reverse("admin-order-list"),
            {"search": "customer-orders"},
        )
        id_response = self.client.get(
            reverse("admin-order-list"),
            {"search": str(pending_order.pk)},
        )

        self.assertEqual(status_response.status_code, 200)
        self.assertEqual(status_response.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(status_response.json()["data"][0]["order_id"], pending_order.pk)
        self.assertEqual(search_response.json()["meta"]["pagination"]["total_items"], 2)
        self.assertEqual(id_response.json()["meta"]["pagination"]["total_items"], 1)

    def test_supplier_orders_search_and_status_filter_work_on_related_data(self):
        own_order = self.create_order(self.variant)
        self.create_order(self.other_variant)
        self.authorize(self.supplier_user)

        status_response = self.client.get(
            reverse("admin-order-list"),
            {"status": SupplierOrderFulfillment.Status.PENDING},
        )
        search_response = self.client.get(
            reverse("admin-order-list"),
            {"search": "Supplier Coat"},
        )
        unrelated_search_response = self.client.get(
            reverse("admin-order-list"),
            {"search": "Other Supplier Hat"},
        )

        self.assertEqual(status_response.status_code, 200)
        self.assertEqual(status_response.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(status_response.json()["data"][0]["order_id"], own_order.pk)
        self.assertEqual(search_response.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(unrelated_search_response.json()["meta"]["pagination"]["total_items"], 0)

    def test_admin_and_supplier_can_update_permitted_statuses_from_admin_order_endpoint(self):
        admin_order = self.create_order(self.variant)
        supplier_order = self.create_order(self.other_variant)

        self.authorize(self.admin)
        admin_response = self.client.patch(
            reverse("admin-order-detail", kwargs={"order_id": admin_order.pk}),
            {"order_status": Order.Status.CANCELLED},
            format="json",
        )
        self.authorize(self.other_supplier_user)
        supplier_response = self.client.patch(
            reverse("admin-order-detail", kwargs={"order_id": supplier_order.pk}),
            {"order_status": SupplierOrderFulfillment.Status.COMPLETED},
            format="json",
        )

        self.assertEqual(admin_response.status_code, 200)
        self.assertEqual(admin_response.json()["data"]["order_status"], Order.Status.CANCELLED)
        self.assertEqual(supplier_response.status_code, 200)
        self.assertEqual(
            supplier_response.json()["data"]["order_status"],
            SupplierOrderFulfillment.Status.COMPLETED,
        )
