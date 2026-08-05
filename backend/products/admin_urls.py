from django.urls import path

from products.views import (
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminProductVariantCreateView,
    AdminProductVariantDetailView,
)

urlpatterns = [
    path("", AdminProductListCreateView.as_view(), name="admin-product-list"),
    path("<int:product_id>", AdminProductDetailView.as_view(), name="admin-product-detail"),
    path(
        "<int:product_id>/variants",
        AdminProductVariantCreateView.as_view(),
        name="admin-product-variant-create",
    ),
    path(
        "<int:product_id>/variants/<int:variant_id>",
        AdminProductVariantDetailView.as_view(),
        name="admin-product-variant-detail",
    ),
]
