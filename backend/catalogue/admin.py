from django.contrib import admin

from catalogue.models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("category_id", "short_id", "main_category_name", "sub_category_name")
    search_fields = ("short_id", "main_category_name", "sub_category_name")
