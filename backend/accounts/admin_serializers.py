from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, Role, Supplier, User


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role.role_name", read_only=True)

    class Meta:
        model = User
        fields = (
            "user_id",
            "name",
            "email",
            "phone",
            "address",
            "role",
            "is_active",
            "is_valid_email",
            "date_created",
        )


class AdminUserCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    role = serializers.ChoiceField(choices=(CUSTOMER_ROLE, ADMIN_ROLE, SUPPLIER_ROLE))
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        candidate = User(email=attrs["email"], name=attrs["name"])
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role_name = validated_data.pop("role")
        role = Role.objects.get(role_name=role_name)
        user = User.objects.create_user(
            role=role,
            is_valid_email=True,
            **validated_data,
        )
        if role_name == SUPPLIER_ROLE:
            Supplier.objects.create(user=user)
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=(CUSTOMER_ROLE, SUPPLIER_ROLE, ADMIN_ROLE),
        required=False,
    )

    class Meta:
        model = User
        fields = ("name", "phone", "address", "role", "is_active")

    def validate(self, attrs):
        user = self.instance
        leaving_active_admin = (
            user.role.role_name == ADMIN_ROLE
            and user.is_active
            and (
                attrs.get("is_active") is False
                or attrs.get("role", ADMIN_ROLE) != ADMIN_ROLE
            )
        )
        if leaving_active_admin and not User.objects.filter(
            role__role_name=ADMIN_ROLE,
            is_active=True,
        ).exclude(pk=user.pk).exists():
            raise serializers.ValidationError(
                {"is_active": ["The final active Administrator cannot be deactivated or reassigned."]}
            )
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        role_name = validated_data.pop("role", None)
        old_role = instance.role.role_name
        if role_name is not None:
            instance.role = Role.objects.get(role_name=role_name)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        resulting_role = instance.role.role_name
        if resulting_role == SUPPLIER_ROLE:
            Supplier.objects.get_or_create(user=instance)
        elif old_role == SUPPLIER_ROLE:
            Supplier.objects.filter(user=instance).delete()
        return instance
