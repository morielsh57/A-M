from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User
from carts.models import Cart, CartProduct
from catalogue.models import Category, Product
from orders.models import Order


class DashboardOverviewApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roles = {
            role_name: Role.objects.get_or_create(role_name=role_name)[0]
            for role_name in (ADMIN_ROLE, SUPPLIER_ROLE, CUSTOMER_ROLE)
        }
        self.admin = self.create_user("admin@example.com", ADMIN_ROLE)
        self.supplier = self.create_user("supplier@example.com", SUPPLIER_ROLE)
        self.customer = self.create_user(
            "customer@example.com",
            CUSTOMER_ROLE,
            timezone.now() - timedelta(days=90),
        )
        self.supplier_profile = Supplier.objects.create(user=self.supplier)
        self.category = Category.objects.create(
            short_id="dashboard-test",
            main_category_name="Dashboard Test",
        )

    def create_user(self, email, role_name, created_at=None):
        user = User.objects.create_user(
            email=email,
            name=email.split("@")[0],
            password="A-Strong-Password-2026!",
            role=self.roles[role_name],
            is_active=True,
            is_valid_email=True,
        )

        if created_at is not None:
            User.objects.filter(pk=user.pk).update(date_created=created_at)
            user.refresh_from_db()

        return user

    def authorize(self, user):
        access = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def create_completed_order(self, amount, created_at):
        cart = Cart.objects.create(customer=self.customer, total_price=amount)
        order = Order.objects.create(
            cart=cart,
            payment_id=12345,
            customer=self.customer,
            total_price=amount,
            order_status=Order.Status.COMPLETED,
        )
        Order.objects.filter(pk=order.pk).update(date_created=created_at)
        order.refresh_from_db()
        return order

    def create_supplier_product(self, name, quantity=20):
        return Product.objects.create(
            catalog_number=f"catalog-{name}",
            name=name,
            price=Decimal("100.00"),
            quantity=quantity,
            category=self.category,
            supplier=self.supplier_profile,
        )

    def test_admin_can_view_customer_and_revenue_dashboard_metrics(self):
        now = timezone.now()
        self.create_user("new-1@example.com", CUSTOMER_ROLE, now - timedelta(days=5))
        self.create_user("new-2@example.com", CUSTOMER_ROLE, now - timedelta(days=10))
        self.create_user("previous@example.com", CUSTOMER_ROLE, now - timedelta(days=45))
        self.create_completed_order(Decimal("300.00"), now - timedelta(days=6))
        self.create_completed_order(Decimal("100.00"), now - timedelta(days=42))

        self.authorize(self.admin)
        response = self.client.get(reverse("admin-dashboard-overview"))

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["customer_amount"], 4)
        self.assertEqual(data["current_period_active_customers"], 2)
        self.assertEqual(data["previous_period_active_customers"], 1)
        self.assertEqual(data["active_customer_trend_percent"], 100.0)
        self.assertEqual(data["revenue_amount"], 300.0)
        self.assertEqual(data["current_period_revenue"], 300.0)
        self.assertEqual(data["previous_period_revenue"], 100.0)
        self.assertEqual(data["revenue_trend_percent"], 200.0)

    def test_supplier_can_view_dashboard_metrics(self):
        now = timezone.now()
        product = self.create_supplier_product("supplier-product")
        self.create_supplier_product("low-stock-product", quantity=3)
        order = self.create_completed_order(Decimal("500.00"), now - timedelta(days=3))
        CartProduct.objects.create(
            cart=order.cart,
            product=product,
            quantity=2,
            unit_price=Decimal("100.00"),
            total_price=Decimal("200.00"),
        )
        self.authorize(self.supplier)

        response = self.client.get(reverse("admin-dashboard-overview"))

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["dashboard_type"], SUPPLIER_ROLE)
        self.assertEqual(data["supplier_product_amount"], 2)
        self.assertEqual(data["supplier_low_stock_product_amount"], 1)
        self.assertEqual(data["supplier_order_amount"], 1)
        self.assertEqual(data["revenue_amount"], 200.0)

    def test_customer_cannot_view_dashboard_metrics(self):
        self.authorize(self.customer)

        response = self.client.get(reverse("admin-dashboard-overview"))

        self.assertEqual(response.status_code, 403)
