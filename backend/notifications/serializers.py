from rest_framework import serializers

from notifications.models import Notification


class SupplierNotificationSerializer(serializers.ModelSerializer):
    order_status = serializers.CharField(source="order.order_status", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "notification_id",
            "order_id",
            "order_status",
            "type",
            "is_read",
            "date_created",
        )
        read_only_fields = fields


class MarkAllNotificationsReadSerializer(serializers.Serializer):
    marked_read = serializers.IntegerField(min_value=0)


class UnreadNotificationCountSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField(min_value=0)
