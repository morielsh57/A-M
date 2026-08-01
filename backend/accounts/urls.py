from django.urls import path

from accounts.views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetView,
    RefreshView,
    RegisterView,
    ResendVerificationView,
    VerifyEmailView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("token/refresh", RefreshView.as_view(), name="token-refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("password/change", PasswordChangeView.as_view(), name="password-change"),
    path("password/forgot", ForgotPasswordView.as_view(), name="password-forgot"),
    path("password/reset", PasswordResetView.as_view(), name="password-reset"),
    path("verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path(
        "resend-verification",
        ResendVerificationView.as_view(),
        name="resend-verification",
    ),
]
