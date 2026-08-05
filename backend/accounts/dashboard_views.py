from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE, SUPPLIER_ROLE, User
from accounts.permissions import HasAnyRole
from accounts.serializers import DashboardOverviewResponseSerializer
from carts.models import CartProduct
from products.models import Product
from orders.models import Order


def calculate_trend_percent(current_value, previous_value):
    if previous_value == 0:
        return 100.0 if current_value > 0 else 0.0

    return round(((current_value - previous_value) / previous_value) * 100, 1)


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({ADMIN_ROLE, SUPPLIER_ROLE})

    @extend_schema(
        summary="View admin dashboard overview metrics",
        description=(
            "Returns customer and revenue overview metrics for the management dashboard. "
            "Revenue is based on completed order totals; true profit requires cost data."
        ),
        responses={200: DashboardOverviewResponseSerializer},
        tags=["Admin Dashboard"],
    )
    def get(self, request):
        now = timezone.now()
        current_period_start = now - timedelta(days=30)
        previous_period_start = now - timedelta(days=60)

        if request.user.role.role_name == SUPPLIER_ROLE:
            return Response(
                self.get_supplier_dashboard_data(
                    request.user,
                    current_period_start,
                    previous_period_start,
                )
            )

        return Response(
            self.get_admin_dashboard_data(current_period_start, previous_period_start)
        )

    def get_admin_dashboard_data(self, current_period_start, previous_period_start):
        active_customers = User.objects.filter(
            role__role_name=CUSTOMER_ROLE,
            is_active=True,
            is_valid_email=True,
        )

        current_customers_count = active_customers.filter(
            date_created__gte=current_period_start,
        ).count()
        previous_customers_count = active_customers.filter(
            date_created__gte=previous_period_start,
            date_created__lt=current_period_start,
        ).count()

        completed_orders = Order.objects.filter(order_status=Order.Status.COMPLETED)
        current_revenue = completed_orders.filter(
            date_created__gte=current_period_start,
        ).aggregate(total=Sum("total_price"))["total"] or Decimal("0")
        previous_revenue = completed_orders.filter(
            date_created__gte=previous_period_start,
            date_created__lt=current_period_start,
        ).aggregate(total=Sum("total_price"))["total"] or Decimal("0")

        return {
            "dashboard_type": ADMIN_ROLE,
            "customer_amount": active_customers.count(),
            "active_customer_trend_percent": calculate_trend_percent(
                current_customers_count,
                previous_customers_count,
            ),
            "current_period_active_customers": current_customers_count,
            "previous_period_active_customers": previous_customers_count,
            "revenue_amount": float(current_revenue),
            "revenue_trend_percent": calculate_trend_percent(
                float(current_revenue),
                float(previous_revenue),
            ),
            "current_period_revenue": float(current_revenue),
            "previous_period_revenue": float(previous_revenue),
        }

    def get_supplier_dashboard_data(
        self,
        supplier_user,
        current_period_start,
        previous_period_start,
    ):
        supplier_products = Product.objects.filter(supplier__user=supplier_user)
        supplier_order_items = CartProduct.objects.filter(
            variant__product__supplier__user=supplier_user,
            cart__orders__order_status=Order.Status.COMPLETED,
        )

        current_order_items = supplier_order_items.filter(
            cart__orders__date_created__gte=current_period_start,
        )
        previous_order_items = supplier_order_items.filter(
            cart__orders__date_created__gte=previous_period_start,
            cart__orders__date_created__lt=current_period_start,
        )
        current_revenue = (
            current_order_items.aggregate(total=Sum("total_price"))["total"]
            or Decimal("0")
        )
        previous_revenue = (
            previous_order_items.aggregate(total=Sum("total_price"))["total"]
            or Decimal("0")
        )
        current_orders_count = current_order_items.values("cart__orders").distinct().count()
        previous_orders_count = previous_order_items.values("cart__orders").distinct().count()

        return {
            "dashboard_type": SUPPLIER_ROLE,
            "supplier_product_amount": supplier_products.count(),
            "supplier_low_stock_product_amount": supplier_products.filter(
                variants__quantity__lte=5,
            ).distinct().count(),
            "supplier_order_amount": current_orders_count,
            "supplier_order_trend_percent": calculate_trend_percent(
                current_orders_count,
                previous_orders_count,
            ),
            "revenue_amount": float(current_revenue),
            "revenue_trend_percent": calculate_trend_percent(
                float(current_revenue),
                float(previous_revenue),
            ),
            "current_period_revenue": float(current_revenue),
            "previous_period_revenue": float(previous_revenue),
        }
