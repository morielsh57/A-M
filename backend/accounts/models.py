from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

CUSTOMER_ROLE = "Customer"
SUPPLIER_ROLE = "Supplier"
ADMIN_ROLE = "Admin"


class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.role_name


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role=None, **extra_fields):
        if not email:
            raise ValueError("The email address is required")
        if not name:
            raise ValueError("The user name is required")

        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    is_valid_email = models.BooleanField(default=False)
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
    )
    date_created = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email


class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="supplier_profile",
    )
    unread_counter = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "suppliers"

    def __str__(self):
        return self.user.name


class EmailVerificationToken(models.Model):
    token_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "email_verification_tokens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Email verification token for {self.user.email}"
