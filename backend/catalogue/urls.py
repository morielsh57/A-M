from django.urls import path

from catalogue.views import CategoryDetailView, CategoryListView

urlpatterns = [
    path("", CategoryListView.as_view(), name="category-list"),
    path("<int:category_id>", CategoryDetailView.as_view(), name="category-detail"),
]
