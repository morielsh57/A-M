from rest_framework import serializers

from catalogue.models import Category


class CategorySerializer(serializers.ModelSerializer):
    parent_category_id = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "category_id",
            "short_id",
            "main_category_name",
            "sub_category_name",
            "parent_category_id",
            "date_created",
        )
        read_only_fields = ("category_id", "date_created")

    def get_parent_category_id(self, category):
        return category.parent_category_id


class CategoryWriteSerializer(serializers.ModelSerializer):
    parent_category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="parent_category",
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Category
        fields = (
            "short_id",
            "main_category_name",
            "sub_category_name",
            "parent_category_id",
        )


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()
