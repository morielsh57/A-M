from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from django.conf import settings
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.exceptions import InvalidVerificationToken
from accounts.models import User
from accounts.serializers import (
    MessageResponseSerializer,
    RegistrationResponseSerializer,
    RegistrationSerializer,
    ResendVerificationSerializer,
)
from accounts.services import register_customer, resend_verification_email, verify_email
from accounts.throttles import VerificationResendEmailThrottle, VerificationResendIPThrottle
from config.api.serializers import ErrorResponseSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Register a customer",
        description=(
            "Public endpoint. Creates an inactive Customer account and sends a "
            "one-hour verification link. Supplier and Admin roles cannot "
            "be selected through public registration."
        ),
        request=RegistrationSerializer,
        responses={
            201: RegistrationResponseSerializer,
            400: ErrorResponseSerializer,
            503: ErrorResponseSerializer,
        },
        examples=[
            OpenApiExample(
                "Customer registration",
                value={
                    "name": "Taylor Smith",
                    "email": "taylor@example.com",
                    "phone": "0501234567",
                    "address": "12 Fashion Street",
                    "password": "A-Strong-Password-2026!",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Registration accepted",
                value={
                    "success": True,
                    "data": {
                        "email": "taylor@example.com",
                        "message": "Registration successful. Check your email to verify your account.",
                    },
                },
                response_only=True,
                status_codes=["201"],
            ),
        ],
        auth=[],
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = register_customer(serializer.validated_data)
        except IntegrityError as exc:
            raise ValidationError(
                {"email": ["An account with this email already exists."]}
            ) from exc
        return Response(
            {
                "email": user.email,
                "message": "Registration successful. Check your email to verify your account.",
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Verify a customer email",
        description=(
            "Public browser endpoint. A valid one-time token verifies and activates "
            "the customer, then redirects to the frontend store."
        ),
        parameters=[
            OpenApiParameter(
                name="token",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="One-time token from the verification email.",
            )
        ],
        responses={
            302: OpenApiResponse(description="Verified; redirects to the frontend store."),
            401: ErrorResponseSerializer,
        },
        auth=[],
        tags=["Authentication"],
    )
    def get(self, request):
        raw_token = request.query_params.get("token", "")
        if not raw_token:
            raise InvalidVerificationToken()
        verify_email(raw_token)
        destination = urlsplit(settings.FRONTEND_VERIFICATION_SUCCESS_URL)
        query = dict(parse_qsl(destination.query, keep_blank_values=True))
        query["token"] = raw_token
        redirect_url = urlunsplit(
            (
                destination.scheme,
                destination.netloc,
                destination.path,
                urlencode(query),
                destination.fragment,
            )
        )
        return HttpResponseRedirect(redirect_url)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [VerificationResendEmailThrottle, VerificationResendIPThrottle]

    @extend_schema(
        summary="Resend a verification email",
        description=(
            "Public endpoint, limited to one request per minute per email and IP. "
            "The response does not reveal whether an unverified account exists."
        ),
        request=ResendVerificationSerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
            429: ErrorResponseSerializer,
            503: ErrorResponseSerializer,
        },
        examples=[
            OpenApiExample(
                "Resend request",
                value={"email": "taylor@example.com"},
                request_only=True,
            )
        ],
        auth=[],
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()

        if user is not None and user.is_valid_email:
            raise ValidationError({"email": ["This email address is already verified."]})
        if user is not None:
            resend_verification_email(user)

        return Response(
            {"message": "If an unverified account exists, a new verification email was sent."}
        )
