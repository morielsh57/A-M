from django.urls import path

from products.views import (
    ProductAutocompleteView,
    ProductCountView,
    ProductDetailView,
    ProductListView,
)

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("autocomplete", ProductAutocompleteView.as_view(), name="product-autocomplete"),
    path("count", ProductCountView.as_view(), name="product-count"),
    path("<int:product_id>", ProductDetailView.as_view(), name="product-detail"),
]
