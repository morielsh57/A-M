from rest_framework import serializers


class AddCartItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CartItemSerializer(serializers.Serializer):
    cart_product_id = serializers.IntegerField()
    cart_id = serializers.IntegerField()
    variant_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class CartItemResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    data = CartItemSerializer()
