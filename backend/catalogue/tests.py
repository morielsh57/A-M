from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, Role, User
from catalogue.models import Category


class CategoryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.roles = {
            role_name: Role.objects.get_or_create(role_name=role_name)[0]
            for role_name in (ADMIN_ROLE, CUSTOMER_ROLE)
        }
        self.admin = User.objects.create_user(
            email="admin@example.com",
            name="admin",
            password="A-Strong-Password-2026!",
            role=self.roles[ADMIN_ROLE],
            is_active=True,
            is_valid_email=True,
        )
        self.customer = User.objects.create_user(
            email="customer@example.com",
            name="customer",
            password="A-Strong-Password-2026!",
            role=self.roles[CUSTOMER_ROLE],
            is_active=True,
            is_valid_email=True,
        )
        self.parent_category = Category.objects.create(
            short_id="men",
            main_category_name="Men",
        )
        self.category = Category.objects.create(
            short_id="men-shirts",
            main_category_name="Men",
            sub_category_name="Shirts",
            parent_category=self.parent_category,
        )

    def test_public_can_list_categories(self):
        response = self.client.get(reverse("category-list"))

        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 2)
        self.assertEqual(data[1]["short_id"], "men-shirts")
        self.assertEqual(data[1]["parent_category_id"], self.parent_category.category_id)

    def test_public_can_view_category_detail(self):
        response = self.client.get(
            reverse("category-detail", kwargs={"category_id": self.category.category_id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["short_id"], "men-shirts")

    def test_public_can_list_main_categories_with_nested_subcategories(self):
        response = self.client.get(reverse("main-category-list"))

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("meta", response.json())
        self.assertEqual(len(response.json()["data"]), 1)
        main_category = response.json()["data"][0]
        self.assertEqual(main_category["category_id"], self.parent_category.category_id)
        self.assertEqual(
            [category["category_id"] for category in main_category["subcategories"]],
            [self.category.category_id],
        )

    def test_public_main_categories_are_returned_from_oldest_to_newest(self):
        women_category = Category.objects.create(
            short_id="women",
            main_category_name="Women",
        )

        response = self.client.get(reverse("main-category-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [category["category_id"] for category in response.json()["data"]],
            [self.parent_category.category_id, women_category.category_id],
        )

    def test_public_main_categories_exclude_inactive_subcategories(self):
        self.category.is_active = False
        self.category.save(update_fields=["is_active"])

        response = self.client.get(reverse("main-category-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"][0]["subcategories"], [])

    def test_public_category_count_includes_active_main_and_subcategories(self):
        response = self.client.get(reverse("category-count"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"count": 2})
        self.assertNotIn("meta", response.json())

    def test_public_category_count_excludes_inactive_category_trees(self):
        self.parent_category.is_active = False
        self.parent_category.save(update_fields=["is_active"])

        response = self.client.get(reverse("category-count"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"count": 0})

    def test_admin_can_patch_category(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            reverse("category-detail", kwargs={"category_id": self.category.category_id}),
            {"sub_category_name": "Overshirts"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.category.refresh_from_db()
        self.assertEqual(self.category.sub_category_name, "Overshirts")

    def test_non_admin_cannot_patch_category(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.patch(
            reverse("category-detail", kwargs={"category_id": self.category.category_id}),
            {"sub_category_name": "Overshirts"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_public_list_excludes_inactive_categories_and_children(self):
        self.parent_category.is_active = False
        self.parent_category.save(update_fields=["is_active"])

        response = self.client.get(reverse("category-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], [])

    def test_public_detail_returns_404_for_inactive_category(self):
        self.category.is_active = False
        self.category.save(update_fields=["is_active"])

        response = self.client.get(
            reverse("category-detail", kwargs={"category_id": self.category.category_id})
        )

        self.assertEqual(response.status_code, 404)
