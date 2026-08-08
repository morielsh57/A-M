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
