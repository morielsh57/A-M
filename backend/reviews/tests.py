from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, Role, User
from carts.models import Cart
from catalogue.models import Category
from orders.models import Order, OrderItem
from products.models import Product, ProductVariant
from reviews.models import Review


class ProductReviewApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        customer_role, _ = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)
        admin_role, _ = Role.objects.get_or_create(role_name=ADMIN_ROLE)
        self.customer = self.create_user("reviewer@example.com", customer_role)
        self.other_customer = self.create_user("other-reviewer@example.com", customer_role)
        self.admin = self.create_user("review-admin@example.com", admin_role)
        self.category = Category.objects.create(
            short_id="review-products",
            main_category_name="Review Products",
        )
        self.product = Product.objects.create(
            catalog_number="REVIEW-100",
            name="Review Product",
            price=Decimal("25.00"),
            category=self.category,
        )
        self.other_product = Product.objects.create(
            catalog_number="REVIEW-200",
            name="Other Product",
            price=Decimal("15.00"),
            category=self.category,
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
        self.completed_order = self.create_order(
            self.customer,
            self.product,
            self.variant,
            Order.Status.COMPLETED,
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

    def create_order(self, customer, product, variant, order_status):
        cart = Cart.objects.create(customer=customer, total_price=product.price)
        order = Order.objects.create(
            cart=cart,
            payment_id=f"REVIEW-PAYMENT-{Cart.objects.count()}",
            customer=customer,
            total_price=product.price,
            order_status=order_status,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            variant=variant,
            product_name=product.name,
            color=variant.color,
            size=variant.size,
            quantity=1,
            unit_price=product.price,
            total_price=product.price,
        )
        return order

    def authorize(self, user):
        self.client.force_authenticate(user=user)

    def review_url(self, product=None):
        return reverse(
            "product-review-list-create",
            kwargs={"product_id": (product or self.product).pk},
        )

    def create_review(self, order=None, stars=5, review_text="Excellent product"):
        return self.client.post(
            self.review_url(),
            {
                "order_id": (order or self.completed_order).pk,
                "stars": stars,
                "review_text": review_text,
            },
            format="json",
        )

    def test_customer_can_submit_star_rating_and_written_review(self):
        self.authorize(self.customer)

        response = self.create_review(stars=5, review_text="Excellent quality")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["stars"], 5)
        self.assertEqual(response.json()["data"]["review_text"], "Excellent quality")
        review = Review.objects.get()
        self.assertEqual(review.customer, self.customer)
        self.assertEqual(review.product, self.product)
        self.assertEqual(review.order, self.completed_order)

    def test_customer_can_edit_only_own_review(self):
        self.authorize(self.customer)
        review_id = self.create_review().json()["data"]["review_id"]

        update = self.client.patch(
            reverse("customer-review-detail", kwargs={"review_id": review_id}),
            {"stars": 4, "review_text": "Updated review"},
            format="json",
        )
        self.authorize(self.other_customer)
        other_update = self.client.patch(
            reverse("customer-review-detail", kwargs={"review_id": review_id}),
            {"stars": 1},
            format="json",
        )

        self.assertEqual(update.status_code, 200)
        self.assertEqual(update.json()["data"]["stars"], 4)
        self.assertEqual(update.json()["data"]["review_text"], "Updated review")
        self.assertEqual(other_update.status_code, 404)

    def test_only_authenticated_customers_can_create_reviews(self):
        unauthenticated = self.create_review()
        self.authorize(self.admin)
        admin = self.create_review()

        self.assertEqual(unauthenticated.status_code, 401)
        self.assertEqual(admin.status_code, 403)
        self.assertFalse(Review.objects.exists())

    def test_review_requires_product_from_customers_completed_order(self):
        pending_order = self.create_order(
            self.customer,
            self.product,
            self.variant,
            Order.Status.PENDING,
        )
        wrong_product_order = self.create_order(
            self.customer,
            self.other_product,
            self.other_variant,
            Order.Status.COMPLETED,
        )
        other_customers_order = self.create_order(
            self.other_customer,
            self.product,
            self.variant,
            Order.Status.COMPLETED,
        )
        self.authorize(self.customer)

        for order in (pending_order, wrong_product_order, other_customers_order):
            with self.subTest(order=order.pk):
                response = self.create_review(order=order)
                self.assertEqual(response.status_code, 400)
        self.assertFalse(Review.objects.exists())

    def test_duplicate_review_for_same_eligible_purchase_is_rejected(self):
        self.authorize(self.customer)

        first = self.create_review()
        duplicate = self.create_review(stars=3, review_text="Duplicate")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(Review.objects.count(), 1)

    def test_rating_and_review_text_are_validated(self):
        self.authorize(self.customer)

        for stars in (0, 6, "invalid"):
            with self.subTest(stars=stars):
                response = self.create_review(stars=stars)
                self.assertEqual(response.status_code, 400)
        blank_review = self.create_review(review_text="   ")
        self.assertEqual(blank_review.status_code, 400)
        self.assertFalse(Review.objects.exists())

    def test_product_apis_return_average_rating_and_review_count(self):
        other_order = self.create_order(
            self.other_customer,
            self.product,
            self.variant,
            Order.Status.COMPLETED,
        )
        self.authorize(self.customer)
        self.create_review(stars=5)
        self.authorize(self.other_customer)
        self.create_review(order=other_order, stars=3, review_text="It was fine")

        product_detail = self.client.get(
            reverse("product-detail", kwargs={"product_id": self.product.pk})
        )
        product_list = self.client.get(reverse("product-list"))

        self.assertEqual(product_detail.status_code, 200)
        self.assertEqual(product_detail.json()["data"]["average_rating"], "4.00")
        self.assertEqual(product_detail.json()["data"]["rating_count"], 2)
        listed_product = next(
            item
            for item in product_list.json()["data"]
            if item["product_id"] == self.product.pk
        )
        self.assertEqual(listed_product["average_rating"], "4.00")
        self.assertEqual(listed_product["rating_count"], 2)

    def test_product_reviews_can_be_listed_and_empty_list_is_successful(self):
        empty = self.client.get(self.review_url())
        self.authorize(self.customer)
        self.create_review(stars=5, review_text="Public review")
        self.client.force_authenticate(user=None)
        listing = self.client.get(self.review_url())

        self.assertEqual(empty.status_code, 200)
        self.assertEqual(empty.json()["data"], [])
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["data"][0]["review_text"], "Public review")
