from decimal import Decimal

from rest_framework import serializers

from pickup_points.models import PickUpPoint


class PickUpPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickUpPoint
        fields = (
            "pick_up_point_id",
            "name",
            "description",
            "address",
            "lat",
            "lng",
            "is_active",
            "date_created",
        )
        read_only_fields = ("pick_up_point_id", "date_created")


class CustomerPickUpPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickUpPoint
        fields = (
            "pick_up_point_id",
            "name",
            "description",
            "address",
            "lat",
            "lng",
        )
        read_only_fields = fields


class CustomerPickUpPointQuerySerializer(serializers.Serializer):
    lat = serializers.DecimalField(
        max_digits=10,
        decimal_places=7,
        min_value=Decimal("-90"),
        max_value=Decimal("90"),
    )
    lng = serializers.DecimalField(
        max_digits=10,
        decimal_places=7,
        min_value=Decimal("-180"),
        max_value=Decimal("180"),
    )
    radius_km = serializers.DecimalField(
        max_digits=8,
        decimal_places=3,
        min_value=Decimal("0.001"),
        default=Decimal("20"),
        required=False,
    )
