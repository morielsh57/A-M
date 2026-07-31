from rest_framework import serializers


class HealthDataSerializer(serializers.Serializer):
    status = serializers.CharField(help_text="Current API service status.")


class HealthResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    data = HealthDataSerializer()


class ErrorDetailSerializer(serializers.Serializer):
    code = serializers.CharField()
    message = serializers.CharField()
    details = serializers.JSONField(allow_null=True)


class ErrorResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=False)
    error = ErrorDetailSerializer()
