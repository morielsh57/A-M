import json
from unittest.mock import MagicMock, patch

from django.core import mail
from django.test import SimpleTestCase, override_settings

from accounts.email_service import TransactionalEmailError, send_transactional_email


class TransactionalEmailServiceTests(SimpleTestCase):
    message = {
        "subject": "Verify account",
        "text_body": "Verification text",
        "html_body": "<p>Verification HTML</p>",
        "recipient_email": "customer@example.com",
        "recipient_name": "Customer",
    }

    @override_settings(
        EMAIL_PROVIDER="brevo",
        BREVO_API_KEY="test-brevo-key",
        DEFAULT_FROM_EMAIL="A&M Fashion <sender@example.com>",
        DEFAULT_FROM_NAME="A&M Fashion",
    )
    @patch("accounts.email_service.request.urlopen")
    def test_brevo_sends_expected_https_request(self, urlopen):
        response = MagicMock(status=201)
        urlopen.return_value.__enter__.return_value = response

        send_transactional_email(**self.message)

        api_request = urlopen.call_args.args[0]
        payload = json.loads(api_request.data)
        self.assertEqual(api_request.full_url, "https://api.brevo.com/v3/smtp/email")
        self.assertEqual(api_request.get_method(), "POST")
        self.assertEqual(api_request.headers["Api-key"], "test-brevo-key")
        self.assertEqual(payload["sender"]["email"], "sender@example.com")
        self.assertEqual(payload["to"][0]["email"], "customer@example.com")
        self.assertEqual(payload["htmlContent"], "<p>Verification HTML</p>")

    @override_settings(EMAIL_PROVIDER="brevo", BREVO_API_KEY="test-brevo-key")
    @patch("accounts.email_service.request.urlopen")
    def test_brevo_failure_is_normalized(self, urlopen):
        from urllib.error import URLError

        urlopen.side_effect = URLError("unavailable")

        with self.assertRaises(TransactionalEmailError):
            send_transactional_email(**self.message)

    @override_settings(
        EMAIL_PROVIDER="smtp",
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_smtp_remains_available_for_local_development(self):
        send_transactional_email(**self.message)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["customer@example.com"])
