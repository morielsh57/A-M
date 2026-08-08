from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdministrator
from config.api.pagination import StandardPageNumberPagination
from pickup_points.models import PickUpPoint
from pickup_points.serializers import PickUpPointSerializer


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
