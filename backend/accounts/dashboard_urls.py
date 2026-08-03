from django.urls import path

from accounts.dashboard_views import DashboardOverviewView

urlpatterns = [
    path("overview", DashboardOverviewView.as_view(), name="admin-dashboard-overview"),
]
