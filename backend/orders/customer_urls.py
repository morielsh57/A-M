from django.urls import path

from orders.views import (
    CustomerOrderCancelView,
    CustomerOrderDetailView,
    CustomerOrderListCreateView,
)


urlpatterns = [
    path("", CustomerOrderListCreateView.as_view(), name="customer-order-list"),
    path("<int:order_id>", CustomerOrderDetailView.as_view(), name="customer-order-detail"),
    path(
        "<int:order_id>/cancel",
        CustomerOrderCancelView.as_view(),
        name="customer-order-cancel",
    ),
]
