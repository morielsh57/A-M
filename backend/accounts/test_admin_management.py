from decimal import Decimal

from django.urls import reverse
from rest_framework.test import APIClient
from django.test import TestCase

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User
from carts.models import Cart, CartProduct
from catalogue.models import Category
from orders.models import Order
from pickup_points.models import PickUpPoint
from products.models import Product, ProductImage, ProductVariant


class AdministratorManagementApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roles = {
            name: Role.objects.get_or_create(role_name=name)[0]
            for name in (ADMIN_ROLE, SUPPLIER_ROLE, CUSTOMER_ROLE)
        }
        self.admin = self.create_user("admin@example.com", ADMIN_ROLE)
        self.customer = self.create_user("customer@example.com", CUSTOMER_ROLE)
        self.supplier_user = self.create_user("supplier@example.com", SUPPLIER_ROLE)
        Supplier.objects.create(user=self.supplier_user)
        self.category = Category.objects.create(
            short_id="admin-shirts",
            main_category_name="Admin Shirts",
        )
        self.product = Product.objects.create(
            catalog_number="ADMIN-100",
            name="Admin Product",
            price=Decimal("30.00"),
            category=self.category,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=3,
        )
        self.cart = Cart.objects.create(customer=self.customer, total_price=Decimal("30.00"))
        self.order = Order.objects.create(
            cart=self.cart,
            payment_id=12345,
            customer=self.customer,
            total_price=Decimal("30.00"),
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

    def authorize(self, user):
        self.client.force_authenticate(user=user)

    def test_non_administrators_are_rejected_by_management_endpoints(self):
        endpoints = (
            ("get", reverse("admin-user-list"), None),
            ("get", reverse("admin-order-list"), None),
            ("get", reverse("admin-pickup-list"), None),
            ("post", reverse("category-list"), {"short_id": "blocked", "main_category_name": "Blocked"}),
            ("post", reverse("admin-product-image-list", kwargs={"product_id": self.product.pk}), {}),
        )
        for user in (self.customer, self.supplier_user):
            self.authorize(user)
            for method, url, body in endpoints:
                with self.subTest(role=user.role.role_name, url=url):
                    response = getattr(self.client, method)(url, body or {}, format="json")
                    self.assertEqual(response.status_code, 403)

    def test_admin_can_create_supplier_and_administrator_accounts(self):
        self.authorize(self.admin)
        supplier_response = self.client.post(
            reverse("admin-user-list"),
            {
                "name": "New Supplier",
                "email": "new-supplier@example.com",
                "password": "A-Strong-Password-2026!",
                "role": SUPPLIER_ROLE,
            },
            format="json",
        )
        admin_response = self.client.post(
            reverse("admin-user-list"),
            {
                "name": "New Admin",
                "email": "new-admin@example.com",
                "password": "A-Strong-Password-2026!",
                "role": ADMIN_ROLE,
            },
            format="json",
        )

        self.assertEqual(supplier_response.status_code, 201)
        self.assertTrue(Supplier.objects.filter(user__email="new-supplier@example.com").exists())
        self.assertEqual(admin_response.status_code, 201)

    def test_admin_can_activate_and_reassign_users(self):
        self.authorize(self.admin)
        response = self.client.patch(
            reverse("admin-user-detail", kwargs={"user_id": self.customer.pk}),
            {"role": SUPPLIER_ROLE, "is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role.role_name, SUPPLIER_ROLE)
        self.assertFalse(self.customer.is_active)
        self.assertTrue(Supplier.objects.filter(user=self.customer).exists())

    def test_final_active_administrator_cannot_be_deactivated_deleted_or_reassigned(self):
        self.authorize(self.admin)
        url = reverse("admin-user-detail", kwargs={"user_id": self.admin.pk})

        self.assertEqual(self.client.patch(url, {"is_active": False}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(url, {"role": CUSTOMER_ROLE}, format="json").status_code, 400)
        self.assertEqual(self.client.delete(url).status_code, 400)

    def test_admin_can_filter_users(self):
        self.authorize(self.admin)
        response = self.client.get(reverse("admin-user-list"), {"role": SUPPLIER_ROLE})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {user["role"] for user in response.json()["data"]},
            {SUPPLIER_ROLE},
        )

    def test_admin_can_filter_and_update_orders_but_cannot_delete_them(self):
        self.authorize(self.admin)
        list_response = self.client.get(reverse("admin-order-list"), {"status": Order.Status.PENDING})
        detail_url = reverse("admin-order-detail", kwargs={"order_id": self.order.pk})
        update_response = self.client.patch(
            detail_url,
            {"order_status": Order.Status.COMPLETED},
            format="json",
        )
        invalid_response = self.client.patch(
            detail_url,
            {"order_status": Order.Status.PENDING},
            format="json",
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()["meta"]["pagination"]["total_items"], 1)
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(invalid_response.status_code, 400)
        self.assertEqual(self.client.delete(detail_url).status_code, 400)

    def test_admin_can_manage_pickup_locations(self):
        self.authorize(self.admin)
        create_response = self.client.post(
            reverse("admin-pickup-list"),
            {"name": "Central", "lat": "31.5000000", "lng": "34.5000000"},
            format="json",
        )
        point_id = create_response.json()["data"]["pick_up_point_id"]
        detail_url = reverse("admin-pickup-detail", kwargs={"pick_up_point_id": point_id})

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(
            self.client.patch(detail_url, {"is_active": False}, format="json").status_code,
            200,
        )
        self.assertEqual(self.client.delete(detail_url).status_code, 204)
        self.assertFalse(PickUpPoint.objects.filter(pk=point_id).exists())

    def test_admin_can_manage_product_image_metadata(self):
        self.authorize(self.admin)
        create_response = self.client.post(
            reverse("admin-product-image-list", kwargs={"product_id": self.product.pk}),
            {
                "variant_id": self.variant.pk,
                "public_id": "admin/product-image",
                "secure_url": "https://res.cloudinary.com/am/image/upload/admin.jpg",
                "is_primary": True,
            },
            format="json",
        )
        image_id = create_response.json()["data"]["image_id"]
        detail_url = reverse(
            "admin-product-image-detail",
            kwargs={"product_id": self.product.pk, "image_id": image_id},
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(
            self.client.patch(detail_url, {"alt_text": "Updated"}, format="json").status_code,
            200,
        )
        self.assertEqual(self.client.delete(detail_url).status_code, 204)
        self.assertFalse(ProductImage.objects.filter(pk=image_id).exists())

    def test_admin_can_create_categories_and_subcategories(self):
        self.authorize(self.admin)
        response = self.client.post(
            reverse("category-list"),
            {
                "short_id": "admin-subcategory",
                "main_category_name": "Admin Shirts",
                "sub_category_name": "Formal",
                "parent_category_id": self.category.pk,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["parent_category_id"], self.category.pk)

    def test_referenced_products_and_categories_cannot_be_deleted(self):
        self.authorize(self.admin)
        CartProduct.objects.create(
            cart=self.cart,
            variant=self.variant,
            quantity=1,
            unit_price=Decimal("30.00"),
            total_price=Decimal("30.00"),
        )

        product_response = self.client.delete(
            reverse("admin-product-detail", kwargs={"product_id": self.product.pk})
        )
        category_response = self.client.delete(
            reverse("category-detail", kwargs={"category_id": self.category.pk})
        )

        self.assertEqual(product_response.status_code, 400)
        self.assertEqual(category_response.status_code, 400)
