from django.urls import path

from catalogue.views import (
    CategoryCountView,
    CategoryDetailView,
    CategoryListView,
    MainCategoryListView,
)

urlpatterns = [
    path("", CategoryListView.as_view(), name="category-list"),
    path("main", MainCategoryListView.as_view(), name="main-category-list"),
    path("count", CategoryCountView.as_view(), name="category-count"),
    path("<int:category_id>", CategoryDetailView.as_view(), name="category-detail"),
]
