from django.urls import path

from reviews.views import CustomerReviewDetailView


urlpatterns = [
    path("<int:review_id>", CustomerReviewDetailView.as_view(), name="customer-review-detail"),
]
