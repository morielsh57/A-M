from django.test import TestCase
from django.urls import reverse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, User
from accounts.permissions import HasAnyRole, IsAdministrator, IsCustomer, IsSupplier


class CustomerOnlyTestView(APIView):
    permission_classes = [IsAuthenticated, IsCustomer]

    def get(self, request):
        return Response({"allowed": True})


class SupplierOnlyTestView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]

    def get(self, request):
        return Response({"allowed": True})


class AdministratorOnlyTestView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]

    def get(self, request):
        return Response({"allowed": True})


class CustomerOrSupplierTestView(APIView):
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({CUSTOMER_ROLE, SUPPLIER_ROLE})

    def get(self, request):
        return Response({"allowed": True})


class RolePermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.users = {}
        for role_name in (CUSTOMER_ROLE, SUPPLIER_ROLE, ADMIN_ROLE):
            role, _ = Role.objects.get_or_create(role_name=role_name)
            self.users[role_name] = User.objects.create_user(
                email=f"{role_name.lower()}@example.com",
                name=f"{role_name} User",
                password="A-Strong-Password-2026!",
                role=role,
                is_active=True,
                is_valid_email=True,
            )

    def request(self, view_class, role_name=None):
        request = self.factory.get("/protected-operation/")
        if role_name:
            access = RefreshToken.for_user(self.users[role_name]).access_token
            request.META["HTTP_AUTHORIZATION"] = f"Bearer {access}"
        return view_class.as_view()(request)

    def test_unauthenticated_role_operation_returns_401(self):
        for view_class in (
            CustomerOnlyTestView,
            SupplierOnlyTestView,
            AdministratorOnlyTestView,
        ):
            with self.subTest(view=view_class.__name__):
                self.assertEqual(self.request(view_class).status_code, 401)

    def test_customer_only_operation_permission_matrix(self):
        self.assertEqual(self.request(CustomerOnlyTestView, CUSTOMER_ROLE).status_code, 200)
        self.assertEqual(self.request(CustomerOnlyTestView, SUPPLIER_ROLE).status_code, 403)
        self.assertEqual(self.request(CustomerOnlyTestView, ADMIN_ROLE).status_code, 403)

    def test_supplier_only_operation_permission_matrix(self):
        self.assertEqual(self.request(SupplierOnlyTestView, SUPPLIER_ROLE).status_code, 200)
        self.assertEqual(self.request(SupplierOnlyTestView, CUSTOMER_ROLE).status_code, 403)
        self.assertEqual(self.request(SupplierOnlyTestView, ADMIN_ROLE).status_code, 403)

    def test_administrator_only_operation_permission_matrix(self):
        self.assertEqual(self.request(AdministratorOnlyTestView, ADMIN_ROLE).status_code, 200)
        self.assertEqual(self.request(AdministratorOnlyTestView, CUSTOMER_ROLE).status_code, 403)
        self.assertEqual(self.request(AdministratorOnlyTestView, SUPPLIER_ROLE).status_code, 403)

    def test_has_any_role_supports_combined_role_access(self):
        self.assertEqual(self.request(CustomerOrSupplierTestView, CUSTOMER_ROLE).status_code, 200)
        self.assertEqual(self.request(CustomerOrSupplierTestView, SUPPLIER_ROLE).status_code, 200)
        self.assertEqual(self.request(CustomerOrSupplierTestView, ADMIN_ROLE).status_code, 403)


class UserProfileApiTests(TestCase):
    safe_fields = {"user_id", "name", "email", "phone", "address", "role"}

    def setUp(self):
        self.client = APIClient()
        self.users = {}
        for role_name in (CUSTOMER_ROLE, SUPPLIER_ROLE, ADMIN_ROLE):
            role, _ = Role.objects.get_or_create(role_name=role_name)
            self.users[role_name] = User.objects.create_user(
                email=f"{role_name.lower()}-profile@example.com",
                name=f"{role_name} Profile",
                phone="0501234567",
                address="Original address",
                password="A-Strong-Password-2026!",
                role=role,
                is_active=True,
                is_valid_email=True,
            )

    def authorize(self, role_name):
        access = RefreshToken.for_user(self.users[role_name]).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_unauthenticated_profile_request_returns_401(self):
        response = self.client.get(reverse("current-user-profile"))

        self.assertEqual(response.status_code, 401)

    def test_every_supported_role_can_view_only_its_token_profile(self):
        for role_name in (CUSTOMER_ROLE, SUPPLIER_ROLE, ADMIN_ROLE):
            with self.subTest(role=role_name):
                self.authorize(role_name)
                response = self.client.get(reverse("current-user-profile"))

                self.assertEqual(response.status_code, 200)
                profile = response.json()["data"]
                self.assertEqual(profile["user_id"], self.users[role_name].pk)
                self.assertEqual(profile["email"], self.users[role_name].email)
                self.assertEqual(profile["role"], role_name)
                self.assertEqual(set(profile), self.safe_fields)

    def test_user_can_update_permitted_profile_fields(self):
        self.authorize(CUSTOMER_ROLE)

        response = self.client.patch(
            reverse("current-user-profile"),
            {
                "name": "Updated Name",
                "phone": "0507654321",
                "address": "Updated address",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user = self.users[CUSTOMER_ROLE]
        user.refresh_from_db()
        self.assertEqual(user.name, "Updated Name")
        self.assertEqual(user.phone, "0507654321")
        self.assertEqual(user.address, "Updated address")

    def test_role_and_account_status_fields_cannot_be_modified(self):
        self.authorize(CUSTOMER_ROLE)
        user = self.users[CUSTOMER_ROLE]
        original_role_id = user.role_id

        response = self.client.patch(
            reverse("current-user-profile"),
            {
                "role": ADMIN_ROLE,
                "role_id": self.users[ADMIN_ROLE].role_id,
                "is_active": False,
                "is_valid_email": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        details = response.json()["error"]["details"]
        self.assertEqual(
            set(details),
            {"role", "role_id", "is_active", "is_valid_email"},
        )
        user.refresh_from_db()
        self.assertEqual(user.role_id, original_role_id)
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_valid_email)

    def test_email_password_and_identity_fields_cannot_be_modified(self):
        self.authorize(SUPPLIER_ROLE)
        user = self.users[SUPPLIER_ROLE]
        original_password = user.password

        response = self.client.patch(
            reverse("current-user-profile"),
            {
                "user_id": self.users[ADMIN_ROLE].pk,
                "email": "attacker@example.com",
                "password": "Changed-Password-2026!",
                "date_created": "2020-01-01T00:00:00Z",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        user.refresh_from_db()
        self.assertEqual(user.email, f"{SUPPLIER_ROLE.lower()}-profile@example.com")
        self.assertEqual(user.password, original_password)

    def test_sensitive_information_is_excluded_from_profile_response(self):
        self.authorize(ADMIN_ROLE)

        response = self.client.get(reverse("current-user-profile"))
        serialized = str(response.json()).lower()

        for sensitive_name in (
            "password",
            "is_active",
            "is_valid_email",
            "token",
            "token_hash",
        ):
            self.assertNotIn(sensitive_name, serialized)
