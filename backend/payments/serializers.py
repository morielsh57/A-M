from rest_framework import serializers


class CreatePayPalOrderSerializer(serializers.Serializer):
    idempotency_key = serializers.UUIDField()


class PaymentItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    color = serializers.CharField(allow_blank=True, allow_null=True)
    size = serializers.CharField(allow_blank=True, allow_null=True)
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class PayPalPaymentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    paypal_order_id = serializers.CharField()
    paypal_capture_id = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    approval_url = serializers.URLField(allow_null=True, required=False)
    items = PaymentItemSerializer(many=True)
