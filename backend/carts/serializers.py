from rest_framework import serializers


class AddCartItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class MergeCartSerializer(serializers.Serializer):
    guest_cart_id = serializers.UUIDField()


class CartItemSerializer(serializers.Serializer):
    cart_product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    color = serializers.CharField(allow_blank=True, allow_null=True)
    size = serializers.CharField(allow_blank=True, allow_null=True)
    quantity = serializers.IntegerField()
    available_quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class CartSerializer(serializers.Serializer):
    cart_id = serializers.IntegerField()
    guest_cart_id = serializers.UUIDField(allow_null=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = CartItemSerializer(many=True)


class CartResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    data = CartSerializer()
