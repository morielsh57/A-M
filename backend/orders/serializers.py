from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from orders.models import Order, OrderItem, SupplierOrderFulfillment
from orders.services import transition_order_status, transition_supplier_fulfillment
from reviews.serializers import ReviewSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(read_only=True)
    variant_id = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "order_item_id",
            "product_id",
            "variant_id",
            "image_url",
            "review",
            "product_name",
            "color",
            "size",
            "quantity",
            "unit_price",
            "total_price",
        )

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_image_url(self, item):
        variant_images = [
            image.secure_url
            for image in item.variant.product_images.all()
            if image.is_active
        ]
        if variant_images:
            return variant_images[0]

        primary_image = next(
            (
                image.secure_url
                for image in item.product.images.all()
                if image.is_active and image.is_primary and image.variant_id is None
            ),
            None,
        )

    @extend_schema_field(ReviewSerializer(allow_null=True))
    def get_review(self, item):
        reviews = getattr(item.order, "_prefetched_objects_cache", {}).get("reviews")
        if reviews is None:
            reviews = item.order.reviews.select_related("customer")

        review = next(
            (
                order_review
                for order_review in reviews
                if order_review.product_id == item.product_id
                and order_review.customer_id == item.order.customer_id
            ),
            None,
        )
        return ReviewSerializer(review).data if review else None
        if primary_image:
            return primary_image

        return next(
            (
                image.secure_url
                for image in item.product.images.all()
                if image.is_active and image.variant_id is None
            ),
            None,
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
    pickup_point_name = serializers.CharField(source="pickup_point.name", read_only=True)
    pickup_point_address = serializers.CharField(source="pickup_point.address", read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "payment_id",
            "pickup_point_id",
            "pickup_point_name",
            "pickup_point_address",
            "total_price",
            "order_status",
            "date_created",
            "date_updated",
            "items",
        )


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    payment_id = serializers.IntegerField(read_only=True)
    pickup_point_id = serializers.IntegerField(read_only=True)
    pickup_point_name = serializers.CharField(source="pickup_point.name", read_only=True)
    pickup_point_address = serializers.CharField(source="pickup_point.address", read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_id",
            "cart_id",
            "payment_id",
            "pickup_point_id",
            "pickup_point_name",
            "pickup_point_address",
            "customer_id",
            "customer_name",
            "customer_email",
            "total_price",
            "order_status",
            "item_count",
            "date_created",
            "date_updated",
            "is_review",
            "items",
        )

    @extend_schema_field(serializers.IntegerField)
    def get_item_count(self, order):
        if hasattr(order, "items"):
            try:
                return len(order.items.all())
            except TypeError:
                pass
        return order.items.count()


class AdminOrderStatusSerializer(serializers.Serializer):
    order_status = serializers.ChoiceField(choices=Order.Status.choices)

    def update(self, instance, validated_data):
        return transition_order_status(
            instance,
            validated_data["order_status"],
            allow_any_transition=True,
        )


class SupplierOrderSerializer(serializers.ModelSerializer):
    order_status = serializers.SerializerMethodField()
    items = OrderItemSerializer(source="supplier_items", many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    pickup_point_id = serializers.IntegerField(read_only=True)
    pickup_point_name = serializers.CharField(source="pickup_point.name", read_only=True)
    pickup_point_address = serializers.CharField(source="pickup_point.address", read_only=True)
    supplier_total_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "order_id",
            "order_status",
            "supplier_total_price",
            "item_count",
            "pickup_point_id",
            "pickup_point_name",
            "pickup_point_address",
            "date_created",
            "date_updated",
            "items",
        )

    @extend_schema_field(serializers.IntegerField)
    def get_item_count(self, order):
        return len(getattr(order, "supplier_items", []))

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
