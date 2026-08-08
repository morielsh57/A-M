from rest_framework import serializers
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field

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
            "is_active",
            "date_created",
        )
        read_only_fields = ("category_id", "date_created")

    @extend_schema_field(OpenApiTypes.INT)
    def get_parent_category_id(self, category):
        return category.parent_category_id


class MainCategorySerializer(CategorySerializer):
    subcategories = CategorySerializer(
        source="active_subcategories",
        many=True,
        read_only=True,
    )

    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + ("subcategories",)


class CategoryCountSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=0)


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
            "is_active",
        )


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()
