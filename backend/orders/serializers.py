from rest_framework import serializers

from orders.models import Order


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "cart_id",
            "payment_id",
            "customer_id",
            "customer_email",
            "total_price",
            "order_status",
            "date_created",
            "is_review",
        )


class AdminOrderStatusSerializer(serializers.Serializer):
    order_status = serializers.ChoiceField(choices=Order.Status.choices)

    def validate_order_status(self, value):
        current = self.instance.order_status
        allowed = {
            Order.Status.PENDING: {Order.Status.COMPLETED, Order.Status.CANCELLED},
            Order.Status.COMPLETED: set(),
            Order.Status.CANCELLED: set(),
        }
        if value == current:
            return value
        if value not in allowed[current]:
            raise serializers.ValidationError(
                f"Order status cannot change from {current} to {value}."
            )
        return value

    def update(self, instance, validated_data):
        instance.order_status = validated_data["order_status"]
        instance.save(update_fields=["order_status"])
        return instance
