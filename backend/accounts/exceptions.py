from rest_framework.exceptions import APIException


class InvalidVerificationToken(APIException):
    status_code = 401
    default_detail = "The email verification token is invalid, expired, or already used."
    default_code = "invalid_verification_token"


class EmailDeliveryFailed(APIException):
    status_code = 503
    default_detail = "The verification email could not be sent. Please try again later."
    default_code = "email_delivery_failed"


class InvalidPasswordResetToken(APIException):
    status_code = 401
    default_detail = "The password reset token is invalid, expired, or already used."
    default_code = "invalid_password_reset_token"
