from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from config.api.serializers import HealthResponseSerializer


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Check API health",
        description="Public endpoint. No authentication or role is required.",
        responses={200: HealthResponseSerializer},
        examples=[
            OpenApiExample(
                "Healthy service",
                value={"success": True, "data": {"status": "ok"}},
                response_only=True,
                status_codes=["200"],
            )
        ],
        auth=[],
        tags=["System"],
    )
    def get(self, request):
        return Response({"status": "ok"})
