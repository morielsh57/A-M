from rest_framework.permissions import BasePermission

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE


class HasAnyRole(BasePermission):
    """Allow authenticated users whose current database role is permitted."""

    allowed_roles = frozenset()
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False

        allowed_roles = getattr(view, "allowed_roles", self.allowed_roles)
        return user.role.role_name in allowed_roles

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsCustomer(HasAnyRole):
    allowed_roles = frozenset({CUSTOMER_ROLE})


class IsCustomerOrAdministrator(HasAnyRole):
    allowed_roles = frozenset({CUSTOMER_ROLE, ADMIN_ROLE})


class IsSupplier(HasAnyRole):
    allowed_roles = frozenset({SUPPLIER_ROLE})


class IsAdministrator(HasAnyRole):
    allowed_roles = frozenset({ADMIN_ROLE})
