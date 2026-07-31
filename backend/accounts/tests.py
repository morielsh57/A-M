import hashlib
from datetime import timedelta
from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from django.contrib.auth import authenticate
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.exceptions import EmailDeliveryFailed
from accounts.models import (
    ADMIN_ROLE,
    CUSTOMER_ROLE,
    EmailVerificationToken,
    User,
)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    BACKEND_BASE_URL="https://testserver",
    FRONTEND_BASE_URL="https://localhost:3001",
    FRONTEND_VERIFICATION_SUCCESS_URL="https://localhost:3001/app",
)
class RegistrationApiTests(TestCase):
    valid_payload = {
        "name": "Taylor Smith",
        "email": "Taylor@Example.com",
        "phone": "0501234567",
        "address": "12 Fashion Street",
        "password": "A-Strong-Password-2026!",
    }

    def setUp(self):
        cache.clear()
        mail.outbox = []
        self.client = APIClient()

    def register(self, **overrides):
        payload = {**self.valid_payload, **overrides}
        return self.client.post(reverse("register"), payload, format="json")

    def raw_token_from_email(self, index=-1):
        url = next(
            part for part in mail.outbox[index].body.split() if "verify-email/?" in part
        )
        return parse_qs(urlparse(url).query)["token"][0]

    def test_customer_can_register_and_password_is_hashed(self):
        response = self.register()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["success"], True)
        user = User.objects.get(email="taylor@example.com")
        self.assertEqual(user.role.role_name, CUSTOMER_ROLE)
        self.assertTrue(user.check_password(self.valid_payload["password"]))
        self.assertNotEqual(user.password, self.valid_payload["password"])
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_valid_email)
        self.assertIsNone(
            authenticate(email=user.email, password=self.valid_payload["password"])
        )

    def test_public_registration_cannot_choose_privileged_role(self):
        response = self.register(role=ADMIN_ROLE)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            User.objects.get(email="taylor@example.com").role.role_name,
            CUSTOMER_ROLE,
        )

    def test_required_fields_are_validated(self):
        for field in self.valid_payload:
            with self.subTest(field=field):
                payload = {**self.valid_payload}
                payload.pop(field)
                response = self.client.post(reverse("register"), payload, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.json()["error"]["details"])

    def test_duplicate_email_is_rejected_case_insensitively(self):
        self.register()
        response = self.register(email="TAYLOR@example.COM")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json()["error"]["details"])
        self.assertEqual(User.objects.count(), 1)

    def test_weak_password_is_rejected(self):
        response = self.register(password="12345678")

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json()["error"]["details"])
        self.assertFalse(User.objects.exists())

    def test_registration_sends_branded_email_and_stores_only_token_hash(self):
        response = self.register()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["taylor@example.com"])
        self.assertEqual(mail.outbox[0].from_email, "A&M Fashion <am.fashion.service@gmail.com>")
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        self.assertIn("A&amp;M Fashion", mail.outbox[0].alternatives[0].content)

        raw_token = self.raw_token_from_email()
        token = EmailVerificationToken.objects.get()
        self.assertNotEqual(token.token_hash, raw_token)
        self.assertEqual(
            token.token_hash,
            hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        )
        expected_expiry = token.created_at + timedelta(hours=1)
        self.assertLess(abs((token.expires_at - expected_expiry).total_seconds()), 2)

    @patch("accounts.services.send_verification_email", side_effect=EmailDeliveryFailed())
    def test_email_failure_rolls_back_registration(self, _send):
        response = self.register()

        self.assertEqual(response.status_code, 503)
        self.assertFalse(User.objects.exists())
        self.assertFalse(EmailVerificationToken.objects.exists())

    def test_valid_token_verifies_activates_and_redirects_customer(self):
        self.register()
        raw_token = self.raw_token_from_email()

        response = self.client.get(reverse("verify-email"), {"token": raw_token})

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            f"https://localhost:3001/app?token={raw_token}",
        )
        user = User.objects.get(email="taylor@example.com")
        self.assertTrue(user.is_valid_email)
        self.assertTrue(user.is_active)
        self.assertIsNotNone(EmailVerificationToken.objects.get().used_at)

    def test_reused_token_is_rejected(self):
        self.register()
        raw_token = self.raw_token_from_email()
        self.client.get(reverse("verify-email"), {"token": raw_token})

        response = self.client.get(reverse("verify-email"), {"token": raw_token})

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json()["error"]["code"],
            "invalid_verification_token",
        )

    def test_expired_token_is_rejected(self):
        self.register()
        raw_token = self.raw_token_from_email()
        EmailVerificationToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

        response = self.client.get(reverse("verify-email"), {"token": raw_token})

        self.assertEqual(response.status_code, 401)
        self.assertFalse(User.objects.get(email="taylor@example.com").is_valid_email)

    def test_invalid_and_missing_tokens_are_rejected(self):
        for params in ({"token": "not-a-real-token"}, {}):
            with self.subTest(params=params):
                response = self.client.get(reverse("verify-email"), params)
                self.assertEqual(response.status_code, 401)

    def test_resend_sends_new_email_and_invalidates_previous_token(self):
        self.register()
        old_raw_token = self.raw_token_from_email()
        old_token = EmailVerificationToken.objects.get()
        cache.clear()

        response = self.client.post(
            reverse("resend-verification"),
            {"email": "TAYLOR@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 2)
        old_token.refresh_from_db()
        self.assertIsNotNone(old_token.used_at)
        self.assertEqual(
            self.client.get(reverse("verify-email"), {"token": old_raw_token}).status_code,
            401,
        )
        self.assertNotEqual(self.raw_token_from_email(0), self.raw_token_from_email(1))

    def test_resend_is_limited_per_email(self):
        self.register()
        cache.clear()
        url = reverse("resend-verification")

        first = self.client.post(
            url,
            {"email": "taylor@example.com"},
            format="json",
            REMOTE_ADDR="10.0.0.1",
        )
        second = self.client.post(
            url,
            {"email": "taylor@example.com"},
            format="json",
            REMOTE_ADDR="10.0.0.2",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)

    def test_resend_is_limited_per_ip(self):
        url = reverse("resend-verification")
        first = self.client.post(
            url,
            {"email": "unknown-one@example.com"},
            format="json",
            REMOTE_ADDR="10.0.0.1",
        )
        second = self.client.post(
            url,
            {"email": "unknown-two@example.com"},
            format="json",
            REMOTE_ADDR="10.0.0.1",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)

    def test_resend_does_not_disclose_unknown_email(self):
        response = self.client.post(
            reverse("resend-verification"),
            {"email": "unknown@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_verified_email_cannot_be_resent(self):
        self.register()
        raw_token = self.raw_token_from_email()
        self.client.get(reverse("verify-email"), {"token": raw_token})
        cache.clear()

        response = self.client.post(
            reverse("resend-verification"),
            {"email": "taylor@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json()["error"]["details"])
