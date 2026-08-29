from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from orders.models import Order, OrderItem, SupplierOrderFulfillment
from orders.services import transition_order_status, transition_supplier_fulfillment


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
    payment_id = serializers.IntegerField(min_value=1)
    pickup_point_id = serializers.IntegerField(min_value=1)


class CustomerOrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    payment_id = serializers.IntegerField(read_only=True)
    pickup_point_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "payment_id",
            "pickup_point_id",
            "total_price",
            "order_status",
            "item_count",
            "date_created",
            "date_updated",
        )


class CustomerOrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_id = serializers.IntegerField(read_only=True)
    pickup_point_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "payment_id",
            "pickup_point_id",
            "total_price",
            "order_status",
            "date_created",
            "date_updated",
            "items",
        )


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    payment_id = serializers.IntegerField(read_only=True)
    pickup_point_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "cart_id",
            "payment_id",
            "pickup_point_id",
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


class SupplierOrderItemSerializer(serializers.ModelSerializer):
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


class SupplierOrderSerializer(serializers.ModelSerializer):
    order_status = serializers.SerializerMethodField()
    items = SupplierOrderItemSerializer(source="supplier_items", many=True, read_only=True)
    supplier_total_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "order_id",
            "order_status",
            "supplier_total_price",
            "date_created",
            "date_updated",
            "items",
        )

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_supplier_total_price(self, order):
        return sum(item.total_price for item in order.supplier_items)

    @extend_schema_field(serializers.ChoiceField(choices=SupplierOrderFulfillment.Status.choices))
    def get_order_status(self, order):
        return order.supplier_fulfillments_for_request[0].status


class SupplierOrderStatusSerializer(serializers.Serializer):
    order_status = serializers.ChoiceField(
        choices=SupplierOrderFulfillment.Status.choices
    )

    def update(self, instance, validated_data):
        return transition_supplier_fulfillment(
            instance,
            validated_data["order_status"],
        )
