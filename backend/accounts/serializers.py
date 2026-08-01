from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

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
