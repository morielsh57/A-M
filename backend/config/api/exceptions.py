import logging

from rest_framework import exceptions, status
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def _error_code(exc):
    if isinstance(exc, exceptions.ValidationError):
        return "validation_error"
    if isinstance(exc, exceptions.NotAuthenticated):
        return "authentication_required"
    if isinstance(exc, exceptions.AuthenticationFailed):
        return "authentication_failed"
    if isinstance(exc, exceptions.PermissionDenied):
        return "permission_denied"
    if isinstance(exc, exceptions.NotFound):
        return "not_found"
    if isinstance(exc, exceptions.MethodNotAllowed):
        return "method_not_allowed"
    if isinstance(exc, exceptions.Throttled):
        return "rate_limited"
    return getattr(exc, "default_code", "request_error")


def _message_and_details(exc, data):
    if isinstance(exc, exceptions.ValidationError):
        return "The submitted data is invalid.", data

    if isinstance(data, dict) and "detail" in data:
        return str(data["detail"]), None
    if isinstance(data, (list, dict)):
        return "The request could not be completed.", data
    return str(data), None


def api_exception_handler(exc, context):
    """Convert every API exception to a safe, predictable JSON structure."""

    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception(
            "Unhandled API exception",
            exc_info=(type(exc), exc, exc.__traceback__),
            extra={"view": context.get("view")},
        )
        from rest_framework.response import Response

        return Response(
            {
                "success": False,
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred.",
                    "details": None,
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    message, details = _message_and_details(exc, response.data)
    response.data = {
        "success": False,
        "error": {
            "code": _error_code(exc),
            "message": message,
            "details": details,
        },
    }
    return response
