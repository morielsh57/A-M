from django.urls import path

from products.views import (
    AdminProductDetailView,
    AdminProductImageDetailView,
    AdminProductImageListCreateView,
    AdminProductImageReplaceView,
    AdminProductImageUploadView,
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
    path(
        "<int:product_id>/images",
        AdminProductImageListCreateView.as_view(),
        name="admin-product-image-list",
    ),
    path(
        "<int:product_id>/images/<int:image_id>",
        AdminProductImageDetailView.as_view(),
        name="admin-product-image-detail",
    ),
    path(
        "<int:product_id>/images/upload",
        AdminProductImageUploadView.as_view(),
        name="admin-product-image-upload",
    ),
    path(
        "<int:product_id>/images/<int:image_id>/replace",
        AdminProductImageReplaceView.as_view(),
        name="admin-product-image-replace",
    ),
]
