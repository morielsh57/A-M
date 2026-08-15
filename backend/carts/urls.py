from django.urls import path

from carts.views import (
    CartItemDetailView,
    CartItemListCreateView,
    CartMergeView,
    CurrentCartView,
    GuestCartCreateView,
)

urlpatterns = [
    path("", CurrentCartView.as_view(), name="cart-detail"),
    path("guest", GuestCartCreateView.as_view(), name="guest-cart-create"),
    path("items", CartItemListCreateView.as_view(), name="cart-items"),
    path("items/<int:cart_product_id>", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("merge", CartMergeView.as_view(), name="cart-merge"),
]
