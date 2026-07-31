from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User


class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(max_length=255)
    phone = serializers.CharField(max_length=50)
    address = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate(self, attrs):
        candidate = User(email=attrs.get("email"), name=attrs.get("name"))
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)

    def validate_email(self, value):
        return value.strip().lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    isAdmin = serializers.BooleanField(required=False, default=False, write_only=True)

    def validate_email(self, value):
        return value.strip().lower()


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)


class AccessTokenSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField(required=False)


class SecureTokenRefreshSerializer(TokenRefreshSerializer):
    token_class = RefreshToken

    def validate(self, attrs):
        token = self.token_class(attrs["refresh"])
        if not User.objects.filter(
            pk=token["user_id"],
            is_active=True,
            is_valid_email=True,
        ).exists():
            raise AuthenticationFailed("Token is invalid or expired.")
        return super().validate(attrs)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": ["The current password is incorrect."]}
            )
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": ["The new passwords do not match."]}
            )
        if attrs["current_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": ["The new password must be different."]}
            )
        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"new_password": list(exc.messages)}
            ) from exc
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": ["The new passwords do not match."]}
            )
        try:
            validate_password(attrs["new_password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"new_password": list(exc.messages)}
            ) from exc
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role.role_name", read_only=True)

    class Meta:
        model = User
        fields = ("user_id", "name", "email", "phone", "address", "role")
        read_only_fields = fields


class UserProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    protected_fields = frozenset(
        {
            "user_id",
            "email",
            "role",
            "role_id",
            "is_active",
            "is_valid_email",
            "password",
            "date_created",
        }
    )

    def validate(self, attrs):
        attempted = self.protected_fields.intersection(self.initial_data)
        if attempted:
            raise serializers.ValidationError(
                {
                    field: ["This field cannot be modified through the profile endpoint."]
                    for field in sorted(attempted)
                }
            )
        return attrs

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if validated_data:
            instance.save(update_fields=list(validated_data))
        return instance


class UserProfileResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    data = UserProfileSerializer()


class RegistrationDataSerializer(serializers.Serializer):
    email = serializers.EmailField()
    message = serializers.CharField()


class RegistrationResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    data = RegistrationDataSerializer()


class MessageDataSerializer(serializers.Serializer):
    message = serializers.CharField()


class MessageResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    data = MessageDataSerializer()
