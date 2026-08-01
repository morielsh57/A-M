import hashlib
from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from accounts.models import (
    ADMIN_ROLE,
    CUSTOMER_ROLE,
    SUPPLIER_ROLE,
    PasswordResetToken,
    Role,
    User,
)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_PASSWORD_RESET_URL="https://localhost:3001/app",
    PASSWORD_RESET_TIMEOUT_SECONDS=3600,
)
class AuthenticationApiTests(TestCase):
    password = "A-Strong-Password-2026!"
    new_password = "A-New-Strong-Password-2026!"

    def setUp(self):
        cache.clear()
        mail.outbox = []
        self.client = APIClient()
        role, _ = Role.objects.get_or_create(role_name=CUSTOMER_ROLE)
        self.user = User.objects.create_user(
            email="taylor@example.com",
            name="Taylor Smith",
            password=self.password,
            role=role,
            is_active=True,
            is_valid_email=True,
        )

    def login(self, email=None, password=None):
        return self.client.post(
            reverse("login"),
            {
                "email": email or self.user.email,
                "password": password or self.password,
            },
            format="json",
        )

    def tokens(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        return response.json()["data"]

    def authorize(self, access):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def reset_token_from_email(self):
        url = next(
            part for part in mail.outbox[-1].body.split() if "token=" in part
        )
        return parse_qs(urlparse(url).query)["token"][0]

    def test_valid_credentials_generate_access_and_refresh_tokens(self):
        response = self.login(email="TAYLOR@EXAMPLE.COM")

        self.assertEqual(response.status_code, 200)
        token_data = response.json()["data"]
        self.assertTrue(token_data["access"])
        self.assertTrue(token_data["refresh"])
        self.assertEqual(AccessToken(token_data["access"])["role"], CUSTOMER_ROLE)
        self.assertEqual(RefreshToken(token_data["refresh"])["role"], CUSTOMER_ROLE)

    def test_invalid_disabled_and_unverified_logins_are_indistinguishable(self):
        wrong = self.login(password="Definitely-Wrong-Password-2026!")
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        disabled = self.login()
        self.user.is_active = True
        self.user.is_valid_email = False
        self.user.save(update_fields=["is_active", "is_valid_email"])
        unverified = self.login()

        for response in (wrong, disabled, unverified):
            self.assertEqual(response.status_code, 401)
            self.assertEqual(
                response.json()["error"]["message"],
                "Invalid email or password.",
            )

    def test_management_login_allows_admin_and_supplier_database_roles(self):
        for role_name in (ADMIN_ROLE, SUPPLIER_ROLE):
            with self.subTest(role=role_name):
                role, _ = Role.objects.get_or_create(role_name=role_name)
                user = User.objects.create_user(
                    email=f"{role_name.lower()}@example.com",
                    name=f"{role_name} User",
                    password=self.password,
                    role=role,
                    is_active=True,
                    is_valid_email=True,
                )

                response = self.client.post(
                    reverse("login"),
                    {
                        "email": user.email,
                        "password": self.password,
                        "isAdmin": True,
                    },
                    format="json",
                )

                self.assertEqual(response.status_code, 200)
                access = response.json()["data"]["access"]
                self.assertEqual(AccessToken(access)["role"], role_name)

    def test_management_login_rejects_customer_with_support_message(self):
        response = self.client.post(
            reverse("login"),
            {
                "email": self.user.email,
                "password": self.password,
                "isAdmin": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json()["error"]["message"],
            "You do not have access to the Admin or Supplier panel. "
            "If you believe this is a mistake, contact the support team.",
        )

    def test_refresh_rotates_token_and_old_refresh_cannot_be_reused(self):
        old_refresh = self.tokens()["refresh"]

        rotated = self.client.post(
            reverse("token-refresh"),
            {"refresh": old_refresh},
            format="json",
        )
        reused = self.client.post(
            reverse("token-refresh"),
            {"refresh": old_refresh},
            format="json",
        )

        self.assertEqual(rotated.status_code, 200)
        self.assertTrue(rotated.json()["data"]["access"])
        self.assertTrue(rotated.json()["data"]["refresh"])
        self.assertEqual(
            AccessToken(rotated.json()["data"]["access"])["role"],
            CUSTOMER_ROLE,
        )
        self.assertEqual(
            RefreshToken(rotated.json()["data"]["refresh"])["role"],
            CUSTOMER_ROLE,
        )
        self.assertEqual(reused.status_code, 401)

    def test_disabled_user_cannot_refresh_tokens(self):
        refresh = self.tokens()["refresh"]
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        response = self.client.post(
            reverse("token-refresh"),
            {"refresh": refresh},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_logout_blacklists_refresh_token(self):
        tokens = self.tokens()
        self.authorize(tokens["access"])

        response = self.client.post(
            reverse("logout"),
            {"refresh": tokens["refresh"]},
            format="json",
        )
        reuse = self.client.post(
            reverse("token-refresh"),
            {"refresh": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(reuse.status_code, 401)

    def test_logout_requires_authentication(self):
        response = self.client.post(
            reverse("logout"),
            {"refresh": "not-a-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_change_password_and_tokens_are_revoked(self):
        tokens = self.tokens()
        self.authorize(tokens["access"])

        response = self.client.post(
            reverse("password-change"),
            {
                "current_password": self.password,
                "new_password": self.new_password,
                "new_password_confirm": self.new_password,
            },
            format="json",
        )
        self.client.credentials()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.login().status_code, 401)
        self.assertEqual(self.login(password=self.new_password).status_code, 200)
        self.assertEqual(
            self.client.post(
                reverse("token-refresh"),
                {"refresh": tokens["refresh"]},
                format="json",
            ).status_code,
            401,
        )

    def test_password_change_rejects_wrong_current_and_weak_passwords(self):
        tokens = self.tokens()
        self.authorize(tokens["access"])

        wrong_current = self.client.post(
            reverse("password-change"),
            {
                "current_password": "Wrong-Password-2026!",
                "new_password": self.new_password,
                "new_password_confirm": self.new_password,
            },
            format="json",
        )
        weak = self.client.post(
            reverse("password-change"),
            {
                "current_password": self.password,
                "new_password": "12345678",
                "new_password_confirm": "12345678",
            },
            format="json",
        )

        self.assertEqual(wrong_current.status_code, 400)
        self.assertIn("current_password", wrong_current.json()["error"]["details"])
        self.assertEqual(weak.status_code, 400)
        self.assertIn("new_password", weak.json()["error"]["details"])

    def test_forgot_password_sends_hashed_single_use_token(self):
        response = self.client.post(
            reverse("password-forgot"),
            {"email": self.user.email},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        raw_token = self.reset_token_from_email()
        token = PasswordResetToken.objects.get()
        self.assertNotEqual(token.token_hash, raw_token)
        self.assertEqual(
            token.token_hash,
            hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        )

    def test_forgot_password_does_not_reveal_whether_account_exists(self):
        existing = self.client.post(
            reverse("password-forgot"),
            {"email": self.user.email},
            format="json",
            REMOTE_ADDR="10.0.0.1",
        )
        cache.clear()
        unknown = self.client.post(
            reverse("password-forgot"),
            {"email": "unknown@example.com"},
            format="json",
            REMOTE_ADDR="10.0.0.2",
        )

        self.assertEqual(existing.status_code, 200)
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(existing.json(), unknown.json())

    def test_valid_reset_changes_password_and_token_cannot_be_reused(self):
        tokens = self.tokens()
        self.client.post(
            reverse("password-forgot"),
            {"email": self.user.email},
            format="json",
        )
        raw_token = self.reset_token_from_email()
        payload = {
            "token": raw_token,
            "new_password": self.new_password,
            "new_password_confirm": self.new_password,
        }

        response = self.client.post(reverse("password-reset"), payload, format="json")
        reused = self.client.post(reverse("password-reset"), payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(reused.status_code, 401)
        self.assertEqual(self.login().status_code, 401)
        self.assertEqual(self.login(password=self.new_password).status_code, 200)
        self.assertEqual(
            self.client.post(
                reverse("token-refresh"),
                {"refresh": tokens["refresh"]},
                format="json",
            ).status_code,
            401,
        )

    def test_expired_and_invalid_reset_tokens_are_rejected(self):
        self.client.post(
            reverse("password-forgot"),
            {"email": self.user.email},
            format="json",
        )
        raw_token = self.reset_token_from_email()
        PasswordResetToken.objects.update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        payload = {
            "new_password": self.new_password,
            "new_password_confirm": self.new_password,
        }

        expired = self.client.post(
            reverse("password-reset"),
            {**payload, "token": raw_token},
            format="json",
        )
        invalid = self.client.post(
            reverse("password-reset"),
            {**payload, "token": "not-a-real-token"},
            format="json",
        )

        self.assertEqual(expired.status_code, 401)
        self.assertEqual(invalid.status_code, 401)

    def test_password_reset_enforces_password_strength(self):
        self.client.post(
            reverse("password-forgot"),
            {"email": self.user.email},
            format="json",
        )
        raw_token = self.reset_token_from_email()

        response = self.client.post(
            reverse("password-reset"),
            {
                "token": raw_token,
                "new_password": "12345678",
                "new_password_confirm": "12345678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password", response.json()["error"]["details"])
        self.assertIsNone(PasswordResetToken.objects.get().used_at)
