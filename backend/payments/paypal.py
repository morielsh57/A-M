import base64
import json
from urllib import error, parse, request

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class PayPalError(Exception):
    def __init__(self, message, *, details=None):
        super().__init__(message)
        self.details = details


class PayPalClient:
    def _credentials(self):
        if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_CLIENT_SECRET:
            raise ImproperlyConfigured(
                "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be configured."
            )
        raw = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}"
        return base64.b64encode(raw.encode()).decode()

    def _send(self, path, *, method="GET", body=None, headers=None):
        encoded = None if body is None else json.dumps(body).encode()
        req = request.Request(
            f"{settings.PAYPAL_BASE_URL}{path}",
            data=encoded,
            method=method,
            headers={"Accept": "application/json", **(headers or {})},
        )
        try:
            with request.urlopen(
                req, timeout=settings.PAYPAL_REQUEST_TIMEOUT_SECONDS
            ) as response:
                return json.loads(response.read().decode())
        except error.HTTPError as exc:
            try:
                details = json.loads(exc.read().decode())
            except (ValueError, UnicodeDecodeError):
                details = None
            raise PayPalError("PayPal rejected the request.", details=details) from exc
        except (error.URLError, TimeoutError, ValueError) as exc:
            raise PayPalError("PayPal is currently unavailable.") from exc

    def access_token(self):
        payload = parse.urlencode({"grant_type": "client_credentials"}).encode()
        req = request.Request(
            f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token",
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Basic {self._credentials()}",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
        )
        try:
            with request.urlopen(
                req, timeout=settings.PAYPAL_REQUEST_TIMEOUT_SECONDS
            ) as response:
                return json.loads(response.read().decode())["access_token"]
        except (error.HTTPError, error.URLError, TimeoutError, ValueError, KeyError) as exc:
            raise PayPalError("PayPal authentication failed.") from exc

    def create_order(self, *, amount, currency, request_id):
        return self._send(
            "/v2/checkout/orders",
            method="POST",
            body={
                "intent": "CAPTURE",
                "purchase_units": [{"amount": {"currency_code": currency, "value": amount}}],
                "payment_source": {
                    "paypal": {
                        "experience_context": {
                            "return_url": settings.PAYPAL_RETURN_URL,
                            "cancel_url": settings.PAYPAL_CANCEL_URL,
                        }
                    }
                },
            },
            headers={
                "Authorization": f"Bearer {self.access_token()}",
                "Content-Type": "application/json",
                "PayPal-Request-Id": request_id,
                "Prefer": "return=representation",
            },
        )

    def capture_order(self, *, provider_order_id, request_id):
        return self._send(
            f"/v2/checkout/orders/{provider_order_id}/capture",
            method="POST",
            body={},
            headers={
                "Authorization": f"Bearer {self.access_token()}",
                "Content-Type": "application/json",
                "PayPal-Request-Id": request_id,
                "Prefer": "return=representation",
            },
        )


paypal_client = PayPalClient()
