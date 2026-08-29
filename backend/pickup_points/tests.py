from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, Role, User
from pickup_points.models import PickUpPoint


class CustomerPickUpPointApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        customer_role, _ = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)
        admin_role, _ = Role.objects.get_or_create(role_name=ADMIN_ROLE)
        self.customer = User.objects.create_user(
            email="pickup-customer@example.com",
            name="Pickup Customer",
            password="A-Strong-Password-2026!",
            role=customer_role,
            is_valid_email=True,
        )
        self.admin = User.objects.create_user(
            email="pickup-admin@example.com",
            name="Pickup Admin",
            password="A-Strong-Password-2026!",
            role=admin_role,
            is_valid_email=True,
        )
        self.center = self.create_point(
            "Maale Adumim pickup", "31.7770000", "35.2980000", is_active=True
        )
        self.nearby = self.create_point(
            "Jerusalem pickup", "31.7683000", "35.2137000", is_active=True
        )
        self.far_away = self.create_point(
            "Tel Aviv pickup", "32.0853000", "34.7818000", is_active=True
        )
        self.inactive = self.create_point(
            "Closed pickup", "31.7770000", "35.2980000", is_active=False
        )

    @staticmethod
    def create_point(name, lat, lng, is_active):
        return PickUpPoint.objects.create(
            name=name,
            description=f"{name} description",
            address=f"{name} address",
            lat=lat,
            lng=lng,
            is_active=is_active,
        )

    def authorize(self, user):
        access = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def get_pickup_points(self, **params):
        return self.client.get(reverse("customer-pickup-point-list"), params)

    def test_default_radius_returns_only_active_nearby_points(self):
        self.authorize(self.customer)

        response = self.get_pickup_points(lat="31.7770000", lng="35.2980000")

        self.assertEqual(response.status_code, 200)
        points = response.json()["data"]
        self.assertEqual(
            [point["pick_up_point_id"] for point in points],
            [self.nearby.pk, self.center.pk],
        )
        returned_ids = {point["pick_up_point_id"] for point in points}
        self.assertNotIn(self.inactive.pk, returned_ids)
        self.assertNotIn(self.far_away.pk, returned_ids)

    def test_custom_radius_controls_distance_filtering(self):
        self.authorize(self.customer)

        narrow = self.get_pickup_points(
            lat="31.7770000", lng="35.2980000", radius_km="5"
        )
        wide = self.get_pickup_points(
            lat="31.7770000", lng="35.2980000", radius_km="100"
        )

        self.assertEqual(
            [point["pick_up_point_id"] for point in narrow.json()["data"]],
            [self.center.pk],
        )
        self.assertEqual(
            {point["pick_up_point_id"] for point in wide.json()["data"]},
            {self.center.pk, self.nearby.pk, self.far_away.pk},
        )

    def test_customer_response_contains_only_checkout_fields(self):
        self.authorize(self.customer)

        response = self.get_pickup_points(lat="31.7770000", lng="35.2980000")

        self.assertEqual(
            set(response.json()["data"][0]),
            {"pick_up_point_id", "name", "description", "address", "lat", "lng"},
        )

    def test_invalid_or_missing_coordinates_return_validation_errors(self):
        self.authorize(self.customer)

        invalid_queries = (
            {"lng": "35.298"},
            {"lat": "31.777"},
            {"lat": "north", "lng": "35.298"},
            {"lat": "91", "lng": "35.298"},
            {"lat": "31.777", "lng": "181"},
            {"lat": "31.777", "lng": "35.298", "radius_km": "0"},
        )
        for query in invalid_queries:
            with self.subTest(query=query):
                response = self.get_pickup_points(**query)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["error"]["code"], "validation_error")

    def test_empty_radius_result_returns_successful_empty_list(self):
        self.authorize(self.customer)

        response = self.get_pickup_points(lat="51.5074000", lng="-0.1278000")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], [])

    def test_unauthenticated_request_is_rejected(self):
        response = self.get_pickup_points(lat="31.777", lng="35.298")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "authentication_required")

    def test_non_customer_request_is_forbidden(self):
        self.authorize(self.admin)

        response = self.get_pickup_points(lat="31.777", lng="35.298")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"]["code"], "permission_denied")

    def test_customer_route_uses_documented_trailing_slash(self):
        self.authorize(self.customer)

        canonical = self.client.get(
            "/api/v1/pickup-points/",
            {"lat": "31.777", "lng": "35.298"},
        )
        slashless = self.client.get(
            "/api/v1/pickup-points",
            {"lat": "31.777", "lng": "35.298"},
        )

        self.assertEqual(canonical.status_code, 200)
        self.assertEqual(slashless.status_code, 404)
