from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Supplier
from accounts.permissions import IsSupplier
from config.api.pagination import StandardPageNumberPagination
from notifications.models import Notification
from notifications.serializers import (
    MarkAllNotificationsReadSerializer,
    SupplierNotificationSerializer,
    UnreadNotificationCountSerializer,
)
from notifications.services import mark_all_notifications_read, mark_notification_read


def get_supplier(user):
    return Supplier.objects.filter(user=user).first()


class SupplierNotificationListView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = SupplierNotificationSerializer

    @extend_schema(
        summary="List the current supplier's notifications",
        responses={200: SupplierNotificationSerializer(many=True)},
        tags=["Supplier Notifications"],
    )
    def get(self, request):
        supplier = get_supplier(request.user)
        notifications = Notification.objects.filter(supplier=supplier).select_related(
            "order"
        ).order_by("-date_created", "-notification_id")
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(notifications, request)
        return paginator.get_paginated_response(
            SupplierNotificationSerializer(page, many=True).data
        )


class SupplierNotificationReadView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = SupplierNotificationSerializer

    @extend_schema(
        summary="Mark one supplier notification as read",
        request=None,
        responses={200: SupplierNotificationSerializer},
        tags=["Supplier Notifications"],
    )
    def post(self, request, notification_id):
        supplier = get_supplier(request.user)
        notification = Notification.objects.filter(
            pk=notification_id,
            supplier=supplier,
        ).first()
        if notification is None:
            raise NotFound("Notification was not found.")
        notification = mark_notification_read(supplier, notification)
        notification = Notification.objects.select_related("order").get(pk=notification.pk)
        return Response(SupplierNotificationSerializer(notification).data)


class SupplierNotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = UnreadNotificationCountSerializer

    @extend_schema(
        summary="Get the current supplier's unread notification count",
        responses={200: UnreadNotificationCountSerializer},
        tags=["Supplier Notifications"],
    )
    def get(self, request):
        supplier = get_supplier(request.user)
        return Response(
            {"unread_count": supplier.unread_counter if supplier is not None else 0}
        )


class SupplierNotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = MarkAllNotificationsReadSerializer

    @extend_schema(
        summary="Mark every supplier notification as read",
        request=None,
        responses={200: MarkAllNotificationsReadSerializer},
        tags=["Supplier Notifications"],
    )
    def post(self, request):
        marked_read = mark_all_notifications_read(get_supplier(request.user))
        return Response({"marked_read": marked_read})
