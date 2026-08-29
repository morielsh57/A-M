from django.urls import path

from notifications.views import (
    SupplierNotificationListView,
    SupplierNotificationReadAllView,
    SupplierNotificationReadView,
    SupplierNotificationUnreadCountView,
)
from orders.views import (
    SupplierOrderDetailView,
    SupplierOrderListView,
    SupplierOrderStatusView,
)
from products.views import SupplierProductDetailView, SupplierProductListView


urlpatterns = [
    path("products", SupplierProductListView.as_view(), name="supplier-product-list"),
    path(
        "products/<int:product_id>",
        SupplierProductDetailView.as_view(),
        name="supplier-product-detail",
    ),
    path("orders", SupplierOrderListView.as_view(), name="supplier-order-list"),
    path(
        "orders/<int:order_id>",
        SupplierOrderDetailView.as_view(),
        name="supplier-order-detail",
    ),
    path(
        "orders/<int:order_id>/status",
        SupplierOrderStatusView.as_view(),
        name="supplier-order-status",
    ),
    path(
        "notifications",
        SupplierNotificationListView.as_view(),
        name="supplier-notification-list",
    ),
    path(
        "notifications/read-all",
        SupplierNotificationReadAllView.as_view(),
        name="supplier-notification-read-all",
    ),
    path(
        "notifications/unread-count",
        SupplierNotificationUnreadCountView.as_view(),
        name="supplier-notification-unread-count",
    ),
    path(
        "notifications/<int:notification_id>/read",
        SupplierNotificationReadView.as_view(),
        name="supplier-notification-read",
    ),
]
