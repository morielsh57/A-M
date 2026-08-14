import hashlib
import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from accounts.exceptions import (
    EmailDeliveryFailed,
    InvalidPasswordResetToken,
    InvalidVerificationToken,
)
from accounts.email_service import send_transactional_email
from accounts.models import (
    CUSTOMER_ROLE,
    EmailVerificationToken,
    PasswordResetToken,
    Role,
    User,
)

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
        f"{settings.BACKEND_BASE_URL}/api/v1/auth/verify-email?"
        f"{urlencode({'token': raw_token})}"
    )
    context = {"user": user, "verification_url": verification_url, "valid_for": "one hour"}
    subject = "Verify your A&M Fashion account"
    text_body = render_to_string("accounts/email/verify_email.txt", context)
    html_body = render_to_string("accounts/email/verify_email.html", context)
    try:
        send_transactional_email(
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            recipient_email=user.email,
            recipient_name=user.name,
        )
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


def revoke_user_refresh_tokens(user):
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


@transaction.atomic
def change_password(user, new_password):
    user.set_password(new_password)
    user.save(update_fields=["password"])
    revoke_user_refresh_tokens(user)


def issue_password_reset_token(user):
    now = timezone.now()
    user.password_reset_tokens.filter(used_at__isnull=True).update(used_at=now)

    raw_token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(
        user=user,
        token_hash=_hash_token(raw_token),
        expires_at=now + timedelta(seconds=settings.PASSWORD_RESET_TIMEOUT_SECONDS),
    )
    return raw_token


def send_password_reset_email(user, raw_token):
    reset_url = f"{settings.FRONTEND_PASSWORD_RESET_URL}?{urlencode({'token': raw_token})}"
    context = {
        "user": user,
        "reset_url": reset_url,
        "valid_for": "one hour",
    }
    send_transactional_email(
        subject="Reset your A&M Fashion password",
        text_body=render_to_string("accounts/email/reset_password.txt", context),
        html_body=render_to_string("accounts/email/reset_password.html", context),
        recipient_email=user.email,
        recipient_name=user.name,
    )


@transaction.atomic
def request_password_reset(user):
    raw_token = issue_password_reset_token(user)
    try:
        send_password_reset_email(user, raw_token)
    except Exception:
        # The public response must not disclose whether this email exists or
        # whether delivery failed. Operational details remain in server logs.
        logger.exception(
            "Failed to send password reset email",
            extra={"user_id": user.pk},
        )


@transaction.atomic
def reset_password(raw_token, new_password):
    try:
        token = (
            PasswordResetToken.objects.select_for_update()
            .select_related("user")
            .get(token_hash=_hash_token(raw_token))
        )
    except PasswordResetToken.DoesNotExist as exc:
        raise InvalidPasswordResetToken() from exc

    now = timezone.now()
    if token.used_at is not None or token.expires_at <= now:
        raise InvalidPasswordResetToken()

    user = token.user
    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise ValidationError({"new_password": list(exc.messages)}) from exc
    token.used_at = now
    token.save(update_fields=["used_at"])
    user.set_password(new_password)
    user.save(update_fields=["password"])
    revoke_user_refresh_tokens(user)
    return user
