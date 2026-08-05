from django.urls import path

from carts.views import CartItemView

urlpatterns = [
    path("items", CartItemView.as_view(), name="cart-items"),
]
