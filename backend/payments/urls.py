from django.urls import path

from payments.views import (
    PayPalOrderCaptureView,
    PayPalOrderCreateView,
    PayPalOrderDetailView,
)


urlpatterns = [
    path("orders", PayPalOrderCreateView.as_view(), name="paypal-order-create"),
    path(
        "orders/<str:provider_order_id>",
        PayPalOrderDetailView.as_view(),
        name="paypal-order-detail",
    ),
    path(
        "orders/<str:provider_order_id>/capture",
        PayPalOrderCaptureView.as_view(),
        name="paypal-order-capture",
    ),
]
