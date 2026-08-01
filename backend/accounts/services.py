import hashlib
import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from accounts.exceptions import EmailDeliveryFailed, InvalidVerificationToken
from accounts.models import CUSTOMER_ROLE, EmailVerificationToken, Role, User

logger = logging.getLogger(__name__)


def _hash_token(raw_token):
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def issue_verification_token(user):
    now = timezone.now()
    user.email_verification_tokens.filter(used_at__isnull=True).update(used_at=now)

    raw_token = secrets.token_urlsafe(32)
    EmailVerificationToken.objects.create(
        user=user,
        token_hash=_hash_token(raw_token),
        expires_at=now + timedelta(seconds=settings.EMAIL_VERIFICATION_TIMEOUT_SECONDS),
    )
    return raw_token


def send_verification_email(user, raw_token):
    verification_url = (
        f"{settings.BACKEND_BASE_URL}/api/v1/auth/verify-email/?"
        f"{urlencode({'token': raw_token})}"
    )
    context = {"user": user, "verification_url": verification_url, "valid_for": "one hour"}
    subject = "Verify your A&M Fashion account"
    text_body = render_to_string("accounts/email/verify_email.txt", context)
    html_body = render_to_string("accounts/email/verify_email.html", context)
    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")

    try:
        message.send(fail_silently=False)
    except Exception as exc:
        logger.exception("Failed to send verification email", extra={"user_id": user.pk})
        raise EmailDeliveryFailed() from exc


@transaction.atomic
def register_customer(validated_data):
    role = Role.objects.get(role_name=CUSTOMER_ROLE)
    user = User.objects.create_user(
        **validated_data,
        role=role,
        is_active=False,
        is_valid_email=False,
    )
    raw_token = issue_verification_token(user)
    send_verification_email(user, raw_token)
    return user


@transaction.atomic
def verify_email(raw_token):
    try:
        token = (
            EmailVerificationToken.objects.select_for_update()
            .select_related("user")
            .get(token_hash=_hash_token(raw_token))
        )
    except EmailVerificationToken.DoesNotExist as exc:
        raise InvalidVerificationToken() from exc

    now = timezone.now()
    if token.used_at is not None or token.expires_at <= now:
        raise InvalidVerificationToken()

    user = token.user
    if user.is_valid_email:
        raise InvalidVerificationToken()

    token.used_at = now
    token.save(update_fields=["used_at"])
    user.is_valid_email = True
    user.is_active = True
    user.save(update_fields=["is_valid_email", "is_active"])
    return user


@transaction.atomic
def resend_verification_email(user):
    raw_token = issue_verification_token(user)
    send_verification_email(user, raw_token)
