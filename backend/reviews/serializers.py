from rest_framework import serializers

from orders.models import Order
from reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Review
        fields = (
            "review_id",
            "product_id",
            "customer_name",
            "review_text",
            "stars",
            "date_created",
        )
        read_only_fields = fields


class ReviewCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(min_value=1)
    stars = serializers.IntegerField(min_value=1, max_value=5)
    review_text = serializers.CharField(allow_blank=False, trim_whitespace=True)

    def validate(self, attrs):
        customer = self.context["request"].user
        product = self.context["product"]
        order = (
            Order.objects.filter(
                pk=attrs["order_id"],
                customer=customer,
                order_status=Order.Status.COMPLETED,
                items__product=product,
            )
            .distinct()
            .first()
        )
        if order is None:
            raise serializers.ValidationError(
                {
                    "order_id": [
                        "A review requires this product in one of your completed orders."
                    ]
                }
            )
        if Review.objects.filter(
            order=order,
            product=product,
            customer=customer,
        ).exists():
            raise serializers.ValidationError(
                {"order_id": ["This eligible purchase has already been reviewed."]}
            )
        attrs["order"] = order
        return attrs

    def create(self, validated_data):
        validated_data.pop("order_id")
        return Review.objects.create(**validated_data)


class ReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("stars", "review_text")
        extra_kwargs = {
            "stars": {"min_value": 1, "max_value": 5},
            "review_text": {"allow_blank": False, "trim_whitespace": True},
        }
