from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdministrator
from config.api.pagination import StandardPageNumberPagination
from orders.models import Order
from orders.serializers import (
    AdminOrderSerializer,
    AdminOrderStatusSerializer,
    CustomerOrderCreateSerializer,
    CustomerOrderDetailSerializer,
    CustomerOrderListSerializer,
)
from orders.services import (
    cancel_customer_order,
    create_order_from_cart,
    get_customer_order,
    require_customer,
)


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
        order = (
            Order.objects.select_related("customer", "cart")
            .prefetch_related("items")
            .filter(pk=order_id)
            .first()
        )
        if order is None:
            raise NotFound("Order was not found.")
        return order


class CustomerOrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerOrderDetailSerializer

    @extend_schema(
        summary="List the current customer's orders",
        responses={200: CustomerOrderListSerializer(many=True)},
        tags=["Customer Orders"],
    )
    def get(self, request):
        require_customer(request.user)
        orders = (
            Order.objects.filter(customer=request.user)
            .annotate(item_count=Count("items"))
            .order_by("-date_created", "-order_id")
        )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(orders, request)
        return paginator.get_paginated_response(
            CustomerOrderListSerializer(page, many=True).data
        )

    @extend_schema(
        summary="Create an order after successful payment confirmation",
        request=CustomerOrderCreateSerializer,
        responses={201: CustomerOrderDetailSerializer, 200: CustomerOrderDetailSerializer},
        tags=["Customer Orders"],
    )
    def post(self, request):
        serializer = CustomerOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order, created = create_order_from_cart(
            request.user,
            serializer.validated_data["payment_id"],
        )
        order = Order.objects.prefetch_related("items").get(pk=order.pk)
        return Response(
            CustomerOrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CustomerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerOrderDetailSerializer

    @extend_schema(
        summary="View complete details for one customer order",
        responses={200: CustomerOrderDetailSerializer},
        tags=["Customer Orders"],
    )
    def get(self, request, order_id):
        order = get_customer_order(request.user, order_id)
        order = Order.objects.prefetch_related("items").get(pk=order.pk)
        return Response(CustomerOrderDetailSerializer(order).data)


class CustomerOrderCancelView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerOrderDetailSerializer

    @extend_schema(
        summary="Cancel a pending customer order",
        responses={200: CustomerOrderDetailSerializer},
        tags=["Customer Orders"],
    )
    def post(self, request, order_id):
        order = cancel_customer_order(request.user, order_id)
        order = Order.objects.prefetch_related("items").get(pk=order.pk)
        return Response(CustomerOrderDetailSerializer(order).data)
