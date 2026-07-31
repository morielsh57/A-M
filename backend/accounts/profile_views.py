from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import (
    UserProfileResponseSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)
from config.api.serializers import ErrorResponseSerializer


class CurrentUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="View the current user's profile",
        description=(
            "Returns the profile belonging to the authenticated Customer, Supplier, "
            "or Admin. Passwords, tokens, and account-status fields are excluded."
        ),
        responses={
            200: UserProfileResponseSerializer,
            401: ErrorResponseSerializer,
        },
        examples=[
            OpenApiExample(
                "Customer profile",
                value={
                    "success": True,
                    "data": {
                        "user_id": 12,
                        "name": "Taylor Smith",
                        "email": "taylor@example.com",
                        "phone": "0501234567",
                        "address": "12 Fashion Street",
                        "role": "Customer",
                    },
                },
                response_only=True,
                status_codes=["200"],
            )
        ],
        tags=["User Profiles"],
    )
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    @extend_schema(
        summary="Update the current user's profile",
        description=(
            "Updates only name, phone, and address. Role, email, password, account "
            "status, verification status, identifiers, and creation date cannot be changed here."
        ),
        request=UserProfileUpdateSerializer,
        responses={
            200: UserProfileResponseSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
        },
        examples=[
            OpenApiExample(
                "Update contact details",
                value={"name": "Taylor Jones", "phone": "0507654321"},
                request_only=True,
            )
        ],
        tags=["User Profiles"],
    )
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserProfileSerializer(user).data, status=status.HTTP_200_OK)
