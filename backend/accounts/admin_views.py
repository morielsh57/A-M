from django.db.models import ProtectedError, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.admin_serializers import (
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
)
from accounts.models import ADMIN_ROLE, User
from accounts.permissions import IsAdministrator
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer


class AdminUserListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]
    serializer_class = AdminUserSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("search", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("role", str, OpenApiParameter.QUERY, required=False),
            OpenApiParameter("is_active", bool, OpenApiParameter.QUERY, required=False),
        ],
        responses={200: AdminUserSerializer(many=True), 201: AdminUserSerializer},
        tags=["Admin Users"],
    )
    def get(self, request):
        users = User.objects.select_related("role").order_by("user_id")
        search = request.query_params.get("search", "").strip()
        if search:
            users = users.filter(Q(name__icontains=search) | Q(email__icontains=search))
        role = request.query_params.get("role")
        if role:
            users = users.filter(role__role_name=role)
        active = request.query_params.get("is_active")
        if active is not None:
            if active.lower() not in {"true", "false"}:
                raise ValidationError({"is_active": ["Use true or false."]})
            users = users.filter(is_active=active.lower() == "true")
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(users, request)
        return paginator.get_paginated_response(AdminUserSerializer(page, many=True).data)

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]
    serializer_class = AdminUserSerializer

    def get(self, request, user_id):
        return Response(AdminUserSerializer(self.get_user(user_id)).data)

    def patch(self, request, user_id):
        serializer = AdminUserUpdateSerializer(
            self.get_user(user_id),
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        return Response(AdminUserSerializer(serializer.save()).data)

    def delete(self, request, user_id):
        user = self.get_user(user_id)
        if user.role.role_name == ADMIN_ROLE and user.is_active and not User.objects.filter(
            role__role_name=ADMIN_ROLE,
            is_active=True,
        ).exclude(pk=user.pk).exists():
            raise ValidationError(
                {"user_id": ["The final active Administrator cannot be deleted."]}
            )
        try:
            user.delete()
        except ProtectedError as exc:
            raise ValidationError(
                {"user_id": ["This account is referenced by protected business records."]}
            ) from exc
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_user(self, user_id):
        user = User.objects.select_related("role").filter(pk=user_id).first()
        if user is None:
            raise NotFound("User was not found.")
        return user
