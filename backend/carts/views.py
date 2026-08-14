from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from carts.serializers import (
    AddCartItemSerializer,
    CartResponseSerializer,
    MergeCartSerializer,
    UpdateCartItemSerializer,
)
from carts.services import (
    GUEST_CART_HEADER,
    add_cart_item,
    create_guest_cart,
    get_request_cart,
    merge_guest_cart,
    remove_cart_item,
    serialize_cart,
    update_cart_item,
)
from config.api.serializers import ErrorResponseSerializer


guest_header_parameter = OpenApiParameter(
    name=GUEST_CART_HEADER,
    type=str,
    location=OpenApiParameter.HEADER,
    required=False,
    description="Secure identifier returned when a guest cart is created.",
)


class GuestCartCreateView(APIView):
    permission_classes = [AllowAny]
    serializer_class = CartResponseSerializer

    @extend_schema(
        summary="Create a guest cart",
        responses={201: CartResponseSerializer},
        auth=[],
        tags=["Cart"],
    )
    def post(self, request):
        cart = create_guest_cart()
        return Response(serialize_cart(cart), status=status.HTTP_201_CREATED)


class CurrentCartView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get the current customer or guest cart",
        parameters=[guest_header_parameter],
        responses={200: CartResponseSerializer, 400: ErrorResponseSerializer, 404: ErrorResponseSerializer},
        tags=["Cart"],
    )
    def get(self, request):
        cart = get_request_cart(request, create_customer=True)
        return Response(serialize_cart(cart))


class CartItemListCreateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Add a product variant to the current cart",
        parameters=[guest_header_parameter],
        request=AddCartItemSerializer,
        responses={
            201: CartResponseSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Cart"],
    )
    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_request_cart(request, create_customer=True)
        cart = add_cart_item(cart, **serializer.validated_data)
        return Response(serialize_cart(cart), status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Update a cart-item quantity",
        parameters=[guest_header_parameter],
        request=UpdateCartItemSerializer,
        responses={200: CartResponseSerializer, 400: ErrorResponseSerializer, 404: ErrorResponseSerializer},
        tags=["Cart"],
    )
    def patch(self, request, cart_product_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_request_cart(request)
        cart = update_cart_item(cart, cart_product_id, serializer.validated_data["quantity"])
        return Response(serialize_cart(cart))

    @extend_schema(
        summary="Remove an item from the current cart",
        parameters=[guest_header_parameter],
        responses={200: CartResponseSerializer, 404: ErrorResponseSerializer},
        tags=["Cart"],
    )
    def delete(self, request, cart_product_id):
        cart = get_request_cart(request)
        cart = remove_cart_item(cart, cart_product_id)
        return Response(serialize_cart(cart))


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Merge a guest cart into the authenticated customer cart",
        request=MergeCartSerializer,
        responses={200: CartResponseSerializer, 400: ErrorResponseSerializer, 404: ErrorResponseSerializer},
        tags=["Cart"],
    )
    def post(self, request):
        serializer = MergeCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = merge_guest_cart(request.user, serializer.validated_data["guest_cart_id"])
        return Response(serialize_cart(cart))
