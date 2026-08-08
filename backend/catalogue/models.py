from django.db import models


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    short_id = models.CharField(max_length=255, unique=True)
    main_category_name = models.CharField(max_length=255)
    sub_category_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    parent_category = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="subcategories",
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "categories"

    def __str__(self):
        if self.sub_category_name:
            return f"{self.main_category_name} - {self.sub_category_name}"
        return self.main_category_name
