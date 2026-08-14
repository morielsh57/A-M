import json
from email.utils import parseaddr
from urllib import error, request

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import EmailMultiAlternatives


class TransactionalEmailError(Exception):
    pass


def _sender():
    parsed_name, parsed_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
    email = parsed_email or settings.DEFAULT_FROM_EMAIL
    name = settings.DEFAULT_FROM_NAME or parsed_name
    return {"name": name, "email": email}


def _send_with_brevo(*, subject, text_body, html_body, recipient_email, recipient_name):
    if not settings.BREVO_API_KEY:
        raise ImproperlyConfigured(
            "BREVO_API_KEY must be configured when EMAIL_PROVIDER=brevo."
        )

    payload = json.dumps(
        {
            "sender": _sender(),
            "to": [{"email": recipient_email, "name": recipient_name}],
            "subject": subject,
            "textContent": text_body,
            "htmlContent": html_body,
        }
    ).encode("utf-8")
    api_request = request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        method="POST",
        headers={
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        },
    )

    try:
        with request.urlopen(
            api_request, timeout=settings.EMAIL_REQUEST_TIMEOUT_SECONDS
        ) as response:
            if response.status != 201:
                raise TransactionalEmailError("Brevo rejected the email request.")
    except error.HTTPError as exc:
        raise TransactionalEmailError("Brevo rejected the email request.") from exc
    except (error.URLError, TimeoutError, OSError) as exc:
        raise TransactionalEmailError("Brevo is currently unavailable.") from exc


def _send_with_django(*, subject, text_body, html_body, recipient_email, **_):
    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient_email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)


def send_transactional_email(
    *, subject, text_body, html_body, recipient_email, recipient_name=""
):
    message = {
        "subject": subject,
        "text_body": text_body,
        "html_body": html_body,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
    }
    if settings.EMAIL_PROVIDER == "brevo":
        return _send_with_brevo(**message)
    if settings.EMAIL_PROVIDER == "smtp":
        return _send_with_django(**message)
    raise ImproperlyConfigured(
        f"Unsupported EMAIL_PROVIDER: {settings.EMAIL_PROVIDER}."
    )
