from rest_framework import serializers

from orders.models import Order, OrderItem
from orders.services import transition_order_status


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(read_only=True)
    variant_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "order_item_id",
            "product_id",
            "variant_id",
            "product_name",
            "color",
            "size",
            "quantity",
            "unit_price",
            "total_price",
        )


class CustomerOrderCreateSerializer(serializers.Serializer):
    payment_id = serializers.CharField(max_length=255, trim_whitespace=True)
    payment_status = serializers.ChoiceField(choices=("COMPLETED",))


class CustomerOrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "payment_id",
            "total_price",
            "order_status",
            "item_count",
            "date_created",
            "date_updated",
        )


class CustomerOrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "payment_id",
            "total_price",
            "order_status",
            "date_created",
            "date_updated",
            "items",
        )


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

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
            "date_updated",
            "is_review",
            "items",
        )


class AdminOrderStatusSerializer(serializers.Serializer):
    order_status = serializers.ChoiceField(choices=Order.Status.choices)

    def update(self, instance, validated_data):
        return transition_order_status(instance, validated_data["order_status"])
