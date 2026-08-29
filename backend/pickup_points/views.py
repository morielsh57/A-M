from math import asin, cos, radians, sin, sqrt

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdministrator, IsCustomerOrAdministrator
from config.api.pagination import StandardPageNumberPagination
from config.api.serializers import ErrorResponseSerializer
from pickup_points.models import PickUpPoint
from pickup_points.serializers import (
    CustomerPickUpPointQuerySerializer,
    CustomerPickUpPointSerializer,
    PickUpPointSerializer,
)


EARTH_RADIUS_KM = 6371.0088


def distance_km(origin_lat, origin_lng, destination_lat, destination_lng):
    origin_latitude = radians(float(origin_lat))
    destination_latitude = radians(float(destination_lat))
    latitude_delta = destination_latitude - origin_latitude
    longitude_delta = radians(float(destination_lng) - float(origin_lng))
    haversine = (
        sin(latitude_delta / 2) ** 2
        + cos(origin_latitude)
        * cos(destination_latitude)
        * sin(longitude_delta / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * asin(sqrt(min(1, haversine)))


class CustomerPickUpPointListView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerOrAdministrator]
    serializer_class = CustomerPickUpPointSerializer

    @extend_schema(
        summary="List active pickup points for checkout",
        description=(
            "Authenticated Customer endpoint. Returns active pickup points within "
            "the requested radius of the checkout map centre."
        ),
        parameters=[
            OpenApiParameter("lat", float, OpenApiParameter.QUERY, required=True),
            OpenApiParameter("lng", float, OpenApiParameter.QUERY, required=True),
            OpenApiParameter(
                "radius_km",
                float,
                OpenApiParameter.QUERY,
                required=False,
                default=20,
            ),
        ],
        responses={
            200: CustomerPickUpPointSerializer(many=True),
            400: ErrorResponseSerializer,
        },
        tags=["Pickup Points"],
    )
    def get(self, request):
        query_serializer = CustomerPickUpPointQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        origin_lat = query_serializer.validated_data["lat"]
        origin_lng = query_serializer.validated_data["lng"]
        radius = float(query_serializer.validated_data["radius_km"])
        points = PickUpPoint.objects.filter(is_active=True).order_by(
            "name", "pick_up_point_id"
        )
        nearby_points = [
            point
            for point in points
            if distance_km(origin_lat, origin_lng, point.lat, point.lng) <= radius
        ]
        return Response(CustomerPickUpPointSerializer(nearby_points, many=True).data)


class AdminPickUpPointListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]
    serializer_class = PickUpPointSerializer

    def get(self, request):
        points = PickUpPoint.objects.order_by("name", "pick_up_point_id")
        active = request.query_params.get("is_active")
        if active in {"true", "false"}:
            points = points.filter(is_active=active == "true")
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(points, request)
        return paginator.get_paginated_response(PickUpPointSerializer(page, many=True).data)

    def post(self, request):
        serializer = PickUpPointSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminPickUpPointDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]
    serializer_class = PickUpPointSerializer

    def get(self, request, pick_up_point_id):
        return Response(PickUpPointSerializer(self.get_point(pick_up_point_id)).data)

    def patch(self, request, pick_up_point_id):
        serializer = PickUpPointSerializer(
            self.get_point(pick_up_point_id),
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pick_up_point_id):
        self.get_point(pick_up_point_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_point(self, point_id):
        point = PickUpPoint.objects.filter(pk=point_id).first()
        if point is None:
            raise NotFound("Pickup location was not found.")
        return point
