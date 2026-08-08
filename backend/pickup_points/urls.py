from django.urls import path

from pickup_points.views import AdminPickUpPointDetailView, AdminPickUpPointListCreateView

urlpatterns = [
    path("", AdminPickUpPointListCreateView.as_view(), name="admin-pickup-list"),
    path(
        "<int:pick_up_point_id>",
        AdminPickUpPointDetailView.as_view(),
        name="admin-pickup-detail",
    ),
]
