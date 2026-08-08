from io import BytesIO
from unittest.mock import patch

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, Role, User
from catalogue.models import Category
from products.cloudinary_service import ImageStorageError
from products.models import Product, ProductImage, ProductVariant


@override_settings(
    CLOUDINARY_CLOUD_NAME="test-cloud",
    CLOUDINARY_API_KEY="test-key",
    CLOUDINARY_API_SECRET="test-secret",
)
class ProductImageUploadApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        admin_role = Role.objects.get_or_create(role_name=ADMIN_ROLE)[0]
        customer_role = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)[0]
        self.admin = User.objects.create_user(
            email="image-admin@example.com",
            name="Image Admin",
            password="A-Strong-Password-2026!",
            role=admin_role,
            is_active=True,
            is_valid_email=True,
        )
        self.customer = User.objects.create_user(
            email="image-customer@example.com",
            name="Image Customer",
            password="A-Strong-Password-2026!",
            role=customer_role,
            is_active=True,
            is_valid_email=True,
        )
        self.category = Category.objects.create(
            short_id="image-products",
            main_category_name="Image Products",
        )
        self.product = Product.objects.create(
            catalog_number="IMAGE-100",
            name="Image Product",
            price="30.00",
            category=self.category,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            color="Black",
            size="M",
            quantity=2,
        )
        self.client.force_authenticate(user=self.admin)

    def image_file(self, name="image.png", image_format="PNG", content_type="image/png"):
        content = BytesIO()
        Image.new("RGB", (20, 20), color="red").save(content, format=image_format)
        return SimpleUploadedFile(name, content.getvalue(), content_type=content_type)

    def asset(self, suffix):
        return {
            "public_id": f"am-store/products/{self.product.pk}/{suffix}",
            "secure_url": f"https://res.cloudinary.com/test/{suffix}.png",
            "width": 20,
            "height": 20,
            "format": "png",
        }

    @patch("products.views.upload_product_image")
    def test_admin_can_upload_multiple_images_and_select_primary(self, upload_mock):
        old_primary = ProductImage.objects.create(
            product=self.product,
            public_id="old-primary",
            secure_url="https://res.cloudinary.com/test/old.png",
            is_primary=True,
        )
        upload_mock.side_effect = [self.asset("one"), self.asset("two")]

        response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {
                "files": [self.image_file("one.png"), self.image_file("two.png")],
                "alt_texts": ["Front view", "Back view"],
                "display_orders": [4, 5],
                "primary_image_index": 1,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()["data"]), 2)
        old_primary.refresh_from_db()
        self.assertFalse(old_primary.is_primary)
        self.assertEqual(ProductImage.objects.filter(product=self.product, is_primary=True).count(), 1)
        self.assertEqual(ProductImage.objects.filter(product=self.product).count(), 3)
        images = list(ProductImage.objects.filter(product=self.product).exclude(pk=old_primary.pk))
        self.assertEqual([image.alt_text for image in images], ["Front view", "Back view"])
        self.assertEqual([image.display_order for image in images], [4, 5])
        self.assertFalse(images[0].is_primary)
        self.assertTrue(images[1].is_primary)

    @patch("products.views.upload_product_image")
    def test_uploaded_product_image_can_be_assigned_when_creating_variant(self, upload_mock):
        upload_mock.return_value = self.asset("unassigned")
        upload_response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {
                "files": [self.image_file("unassigned.png")],
                "alt_texts": ["White product view"],
            },
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, 201)
        uploaded_image = upload_response.json()["data"][0]
        self.assertIsNone(uploaded_image["variant_id"])

        variant_response = self.client.post(
            reverse(
                "admin-product-variant-create",
                kwargs={"product_id": self.product.pk},
            ),
            {
                "color": "White",
                "size": "L",
                "quantity": 4,
                "image_ids": [uploaded_image["image_id"]],
            },
            format="json",
        )

        self.assertEqual(variant_response.status_code, 201)
        image = ProductImage.objects.get(pk=uploaded_image["image_id"])
        self.assertIsNotNone(image.variant_id)
        self.assertEqual(image.variant.color, "White")
        self.assertEqual(
            image.variant.product_images.get().secure_url,
            self.asset("unassigned")["secure_url"],
        )

    @patch("products.views.upload_product_image")
    def test_batch_metadata_count_must_match_file_count(self, upload_mock):
        response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {
                "files": [self.image_file("one.png"), self.image_file("two.png")],
                "alt_texts": ["Only one description"],
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        upload_mock.assert_not_called()

    @patch("products.views.upload_product_image")
    def test_swagger_comma_separated_batch_metadata_is_supported(self, upload_mock):
        upload_mock.side_effect = [self.asset("one"), self.asset("two")]
        response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {
                "files": [self.image_file("one.png"), self.image_file("two.png")],
                "alt_texts": "Front view,Back view",
                "display_orders": "0,1",
                "primary_image_index": "0",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            [image["alt_text"] for image in response.json()["data"]],
            ["Front view", "Back view"],
        )
        self.assertEqual(
            [image["display_order"] for image in response.json()["data"]],
            [0, 1],
        )

    @patch("products.views.upload_product_image")
    def test_invalid_or_mismatched_files_are_rejected_before_upload(self, upload_mock):
        invalid = SimpleUploadedFile("fake.png", b"not-an-image", content_type="image/png")
        response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {"files": [invalid]},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        upload_mock.assert_not_called()

    @override_settings(PRODUCT_IMAGE_MAX_SIZE_BYTES=10)
    @patch("products.views.upload_product_image")
    def test_oversized_images_are_rejected(self, upload_mock):
        response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {"files": [self.image_file()]},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        upload_mock.assert_not_called()

    @patch("products.views.upload_product_image")
    def test_non_admin_cannot_upload_images(self, upload_mock):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
            {"files": [self.image_file()]},
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)
        upload_mock.assert_not_called()

    @patch("products.views.destroy_product_image")
    @patch("products.views.upload_product_image")
    def test_database_failure_cleans_up_uploaded_asset(self, upload_mock, destroy_mock):
        upload_mock.return_value = self.asset("orphan")
        with patch("products.views.ProductImage.objects.create", side_effect=IntegrityError):
            with self.assertLogs("config.api.exceptions", level="ERROR"):
                response = self.client.post(
                    reverse("admin-product-image-upload", kwargs={"product_id": self.product.pk}),
                    {"files": [self.image_file()]},
                    format="multipart",
                )

        self.assertEqual(response.status_code, 500)
        destroy_mock.assert_called_once_with(
            self.asset("orphan")["public_id"],
            suppress_errors=True,
        )

    @patch("products.views.destroy_product_image")
    @patch("products.views.upload_product_image")
    def test_replacement_keeps_retry_metadata_when_old_cleanup_fails(
        self, upload_mock, destroy_mock
    ):
        image = ProductImage.objects.create(
            product=self.product,
            public_id="old-asset",
            secure_url="https://res.cloudinary.com/test/old.png",
        )
        upload_mock.return_value = self.asset("replacement")
        destroy_mock.return_value = False

        response = self.client.post(
            reverse(
                "admin-product-image-replace",
                kwargs={"product_id": self.product.pk, "image_id": image.pk},
            ),
            {"file": self.image_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        image.refresh_from_db()
        self.assertEqual(image.public_id, self.asset("replacement")["public_id"])
        self.assertEqual(image.pending_delete_public_id, "old-asset")

    @patch("products.views.destroy_product_image", side_effect=ImageStorageError())
    def test_failed_cloudinary_deletion_preserves_database_record(self, destroy_mock):
        image = ProductImage.objects.create(
            product=self.product,
            public_id="delete-failure",
            secure_url="https://res.cloudinary.com/test/delete.png",
        )
        response = self.client.delete(
            reverse(
                "admin-product-image-detail",
                kwargs={"product_id": self.product.pk, "image_id": image.pk},
            )
        )

        self.assertEqual(response.status_code, 502)
        self.assertTrue(ProductImage.objects.filter(pk=image.pk).exists())

    def test_arbitrary_cloudinary_metadata_cannot_be_created(self):
        response = self.client.post(
            reverse("admin-product-image-list", kwargs={"product_id": self.product.pk}),
            {
                "public_id": "forged",
                "secure_url": "https://example.com/forged.png",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 405)
