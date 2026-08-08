from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdministrator
from config.api.pagination import StandardPageNumberPagination
from orders.models import Order
from orders.serializers import AdminOrderSerializer, AdminOrderStatusSerializer


class AdminOrderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]
    serializer_class = AdminOrderSerializer

    def get(self, request):
        orders = Order.objects.select_related("customer", "cart").order_by(
            "-date_created", "order_id"
        )
        order_status = request.query_params.get("status")
        if order_status:
            if order_status not in Order.Status.values:
                raise ValidationError({"status": ["Unsupported order status."]})
            orders = orders.filter(order_status=order_status)
        customer = request.query_params.get("customer", "").strip()
        if customer:
            orders = orders.filter(
                Q(customer__email__icontains=customer)
                | Q(customer__name__icontains=customer)
            )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(orders, request)
        return paginator.get_paginated_response(AdminOrderSerializer(page, many=True).data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdministrator]
    serializer_class = AdminOrderSerializer

    def get(self, request, order_id):
        return Response(AdminOrderSerializer(self.get_order(order_id)).data)

    def patch(self, request, order_id):
        order = self.get_order(order_id)
        serializer = AdminOrderStatusSerializer(order, data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(AdminOrderSerializer(serializer.save()).data)

    def delete(self, request, order_id):
        self.get_order(order_id)
        raise ValidationError(
            {"order_id": ["Orders are historical business records and cannot be deleted."]}
        )

    def get_order(self, order_id):
        order = Order.objects.select_related("customer", "cart").filter(pk=order_id).first()
        if order is None:
            raise NotFound("Order was not found.")
        return order
