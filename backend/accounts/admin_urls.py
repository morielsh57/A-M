from django.urls import path

from accounts.admin_views import AdminUserDetailView, AdminUserListCreateView

urlpatterns = [
    path("", AdminUserListCreateView.as_view(), name="admin-user-list"),
    path("<int:user_id>", AdminUserDetailView.as_view(), name="admin-user-detail"),
]
