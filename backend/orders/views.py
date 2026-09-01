from django.db.models import Count, Prefetch, Q
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ADMIN_ROLE, SUPPLIER_ROLE, Supplier
from accounts.permissions import HasAnyRole, IsSupplier
from config.api.pagination import StandardPageNumberPagination
from orders.models import Order, OrderItem, SupplierOrderFulfillment
from orders.serializers import (
    AdminOrderSerializer,
    AdminOrderStatusSerializer,
    CustomerOrderCreateSerializer,
    CustomerOrderDetailSerializer,
    CustomerOrderListSerializer,
    SupplierOrderSerializer,
    SupplierOrderStatusSerializer,
)
from orders.services import (
    cancel_customer_order,
    create_order_from_cart,
    get_customer_order,
    require_customer,
)


ORDER_ITEMS_WITH_IMAGES = (
    OrderItem.objects.select_related("product", "variant")
    .prefetch_related("variant__product_images", "product__images")
    .order_by("order_item_id")
)


class AdminOrderListView(APIView):
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({ADMIN_ROLE, SUPPLIER_ROLE})
    serializer_class = AdminOrderSerializer

    def get(self, request):
        orders = self.get_scoped_queryset(request).order_by("-date_created", "order_id")
        order_status = request.query_params.get("status")
        if order_status:
            if order_status not in Order.Status.values:
                raise ValidationError({"status": ["Unsupported order status."]})
            orders = self.filter_by_status(request, orders, order_status)
        search = request.query_params.get("search", "").strip()
        customer = request.query_params.get("customer", "").strip()
        if search or customer:
            orders = self.filter_by_search(request, orders, search or customer)
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(orders, request)
        serializer_class = self.get_serializer_class(request)
        return paginator.get_paginated_response(serializer_class(page, many=True).data)

    def get_serializer_class(self, request=None):
        if request is None:
            return AdminOrderSerializer
        if request.user.role.role_name == SUPPLIER_ROLE:
            return SupplierOrderSerializer
        return AdminOrderSerializer

    def get_scoped_queryset(self, request):
        if request.user.role.role_name == SUPPLIER_ROLE:
            return get_supplier_order_queryset(request.user)
        return (
            Order.objects.select_related("customer", "cart", "pickup_point")
            .prefetch_related(Prefetch("items", queryset=ORDER_ITEMS_WITH_IMAGES))
        )

    def filter_by_status(self, request, orders, order_status):
        if request.user.role.role_name == SUPPLIER_ROLE:
            return orders.filter(
                supplier_fulfillments__supplier__user=request.user,
                supplier_fulfillments__status=order_status,
            )
        return orders.filter(order_status=order_status)

    def filter_by_search(self, request, orders, search):
        filters = Q()
        if search.isdigit():
            filters |= Q(order_id=int(search))
        if request.user.role.role_name == SUPPLIER_ROLE:
            filters |= Q(
                items__product__supplier__user=request.user,
                items__product_name__icontains=search,
            )
        else:
            filters |= (
                Q(customer__email__icontains=search)
                | Q(customer__name__icontains=search)
            )
        return orders.filter(filters).distinct()


def get_supplier_order_queryset(user):
    try:
        supplier = user.supplier_profile
    except Supplier.DoesNotExist:
        return Order.objects.none()

    supplier_items = ORDER_ITEMS_WITH_IMAGES.filter(product__supplier=supplier)
    supplier_fulfillments = SupplierOrderFulfillment.objects.filter(
        supplier=supplier,
    )
    return (
        Order.objects.filter(items__product__supplier=supplier)
        .select_related("pickup_point")
        .prefetch_related(
            Prefetch("items", queryset=supplier_items, to_attr="supplier_items"),
            Prefetch(
                "supplier_fulfillments",
                queryset=supplier_fulfillments,
                to_attr="supplier_fulfillments_for_request",
            ),
        )
        .distinct()
    )


class SupplierOrderListView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = SupplierOrderSerializer

    @extend_schema(
        summary="List orders relevant to the current supplier",
        description=(
            "Authenticated Supplier endpoint. Each order contains only items assigned "
            "to the current supplier and excludes payment and customer details."
        ),
        responses={200: SupplierOrderSerializer(many=True)},
        tags=["Supplier Orders"],
    )
    def get(self, request):
        orders = get_supplier_order_queryset(request.user).order_by(
            "-date_created", "-order_id"
        )
        paginator = StandardPageNumberPagination()
        page = paginator.paginate_queryset(orders, request)
        return paginator.get_paginated_response(SupplierOrderSerializer(page, many=True).data)


class SupplierOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = SupplierOrderSerializer

    @extend_schema(
        summary="View one order relevant to the current supplier",
        responses={200: SupplierOrderSerializer},
        tags=["Supplier Orders"],
    )
    def get(self, request, order_id):
        order = get_supplier_order_queryset(request.user).filter(pk=order_id).first()
        if order is None:
            raise NotFound("Order was not found.")
        return Response(SupplierOrderSerializer(order).data)


class SupplierOrderStatusView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]
    serializer_class = SupplierOrderStatusSerializer

    @extend_schema(
        summary="Update the current supplier's fulfilment status",
        description=(
            "Authenticated Supplier endpoint. A supplier may complete only its own "
            "pending portion of an order."
        ),
        request=SupplierOrderStatusSerializer,
        responses={200: SupplierOrderSerializer},
        tags=["Supplier Orders"],
    )
    def patch(self, request, order_id):
        order = get_supplier_order_queryset(request.user).filter(pk=order_id).first()
        if order is None:
            raise NotFound("Order was not found.")
        fulfillment = order.supplier_fulfillments_for_request[0]
        serializer = SupplierOrderStatusSerializer(
            fulfillment,
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        order = get_supplier_order_queryset(request.user).get(pk=order_id)
        return Response(SupplierOrderSerializer(order).data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, HasAnyRole]
    allowed_roles = frozenset({ADMIN_ROLE, SUPPLIER_ROLE})
    serializer_class = AdminOrderSerializer

    def get(self, request, order_id):
        order = self.get_order(request, order_id)
        return Response(self.get_serializer_class(request)(order).data)

    def patch(self, request, order_id):
        order = self.get_order(request, order_id)
        serializer_class = (
            SupplierOrderStatusSerializer
            if request.user.role.role_name == SUPPLIER_ROLE
            else AdminOrderStatusSerializer
        )
        instance = (
            order.supplier_fulfillments_for_request[0]
            if request.user.role.role_name == SUPPLIER_ROLE
            else order
        )
        serializer = serializer_class(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        order = self.get_order(request, order_id)
        return Response(self.get_serializer_class(request)(order).data)

    def delete(self, request, order_id):
        self.get_order(request, order_id)
        raise ValidationError(
            {"order_id": ["Orders are historical business records and cannot be deleted."]}
        )

    def get_serializer_class(self, request=None):
        if request is None:
            return AdminOrderSerializer
        if request.user.role.role_name == SUPPLIER_ROLE:
            return SupplierOrderSerializer
        return AdminOrderSerializer

    def get_order(self, request, order_id):
        if request.user.role.role_name == SUPPLIER_ROLE:
            order = get_supplier_order_queryset(request.user).filter(pk=order_id).first()
        else:
            order = (
                Order.objects.select_related("customer", "cart", "pickup_point")
                .prefetch_related(Prefetch("items", queryset=ORDER_ITEMS_WITH_IMAGES))
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
            serializer.validated_data["pickup_point_id"],
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
