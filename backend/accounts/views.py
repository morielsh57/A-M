from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.exceptions import InvalidVerificationToken
from accounts.models import ADMIN_ROLE, SUPPLIER_ROLE, User
from accounts.serializers import (
    AccessTokenSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    MessageResponseSerializer,
    PasswordChangeSerializer,
    PasswordResetSerializer,
    RefreshTokenSerializer,
    RegistrationResponseSerializer,
    RegistrationSerializer,
    ResendVerificationSerializer,
    SecureTokenRefreshSerializer,
    TokenPairSerializer,
)
from accounts.services import (
    change_password,
    register_customer,
    request_password_reset,
    resend_verification_email,
    reset_password,
    verify_email,
)
from accounts.throttles import (
    PasswordResetEmailThrottle,
    PasswordResetIPThrottle,
    VerificationResendEmailThrottle,
    VerificationResendIPThrottle,
)
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


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Log in",
        description=(
            "Authenticates an active, verified user and returns short-lived access "
            "and rotating refresh tokens. Both tokens include the user's role for frontend "
            "routing; backend permissions still use the current database role. Invalid "
            "credentials and unavailable accounts use the same generic message. When `isAdmin` is true, "
            "the account must have the Admin or Supplier database role to access the "
            "shared management panel; other roles receive a 403 response with support guidance."
        ),
        request=LoginSerializer,
        responses={
            200: TokenPairSerializer,
            401: ErrorResponseSerializer,
            403: ErrorResponseSerializer,
        },
        examples=[
            OpenApiExample(
                "Login request",
                value={"email": "taylor@example.com", "password": "A-Strong-Password-2026!"},
                request_only=True,
            ),
            OpenApiExample(
                "Admin or Supplier panel login",
                value={
                    "email": "admin@amfashion.com",
                    "password": "A-Strong-Password-2026!",
                    "isAdmin": True,
                },
                request_only=True,
            ),
            OpenApiExample(
                "Tokens issued",
                value={"success": True, "data": {"access": "eyJ...", "refresh": "eyJ..."}},
                response_only=True,
                status_codes=["200"],
            ),
        ],
        auth=[],
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request=request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        management_login = serializer.validated_data["isAdmin"]
        allowed_management_roles = {ADMIN_ROLE, SUPPLIER_ROLE}
        if user is None or not user.is_active or not user.is_valid_email:
            raise AuthenticationFailed("Invalid email or password.")
        if management_login and user.role.role_name not in allowed_management_roles:
            raise PermissionDenied(
                "You do not have access to the Admin or Supplier panel. "
                "If you believe this is a mistake, contact the support team."
            )

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role.role_name
        return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    serializer_class = SecureTokenRefreshSerializer

    @extend_schema(
        summary="Refresh authentication tokens",
        description=(
            "Rotates a valid refresh token. The submitted refresh token is blacklisted "
            "and cannot be reused."
        ),
        request=RefreshTokenSerializer,
        responses={200: AccessTokenSerializer, 401: ErrorResponseSerializer},
        auth=[],
        tags=["Authentication"],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Log out",
        description="Blacklists the authenticated user's refresh token.",
        request=LogoutSerializer,
        responses={200: MessageResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            if str(token["user_id"]) != str(request.user.pk):
                raise TokenError("Token does not belong to the authenticated user")
            token.blacklist()
        except TokenError as exc:
            raise ValidationError({"refresh": ["The refresh token is invalid."]}) from exc
        return Response({"message": "Logout successful."})


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Change password",
        description=(
            "Requires the current password. A successful change revokes all outstanding "
            "refresh tokens for the user."
        ),
        request=PasswordChangeSerializer,
        responses={200: MessageResponseSerializer, 400: ErrorResponseSerializer},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        change_password(request.user, serializer.validated_data["new_password"])
        return Response({"message": "Password changed successfully. Please log in again."})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetEmailThrottle, PasswordResetIPThrottle]

    @extend_schema(
        summary="Request a password reset",
        description=(
            "Sends a one-time password-reset link when an eligible account exists. "
            "The response never reveals whether the email is registered."
        ),
        request=ForgotPasswordSerializer,
        responses={200: MessageResponseSerializer, 429: ErrorResponseSerializer},
        auth=[],
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"],
            is_active=True,
            is_valid_email=True,
        ).first()
        if user is not None:
            request_password_reset(user)
        return Response(
            {"message": "If an account exists, a password reset email was sent."}
        )


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Reset a forgotten password",
        description="Consumes a valid, unexpired, single-use password-reset token.",
        request=PasswordResetSerializer,
        responses={
            200: MessageResponseSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
        },
        auth=[],
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_password(
            serializer.validated_data["token"],
            serializer.validated_data["new_password"],
        )
        return Response({"message": "Password reset successful. You can now log in."})
