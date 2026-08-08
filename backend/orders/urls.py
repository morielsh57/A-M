from django.urls import path

from orders.views import AdminOrderDetailView, AdminOrderListView

urlpatterns = [
    path("", AdminOrderListView.as_view(), name="admin-order-list"),
    path("<int:order_id>", AdminOrderDetailView.as_view(), name="admin-order-detail"),
]
