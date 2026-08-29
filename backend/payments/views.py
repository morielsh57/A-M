from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsCustomerOrAdministrator
from config.api.serializers import ErrorResponseSerializer
from payments.serializers import CreatePayPalOrderSerializer, PayPalPaymentSerializer
from payments.services import (
    capture_paypal_order,
    create_paypal_order,
    get_owned_payment,
    serialize_payment,
)


class PayPalOrderCreateView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerOrAdministrator]

    @extend_schema(
        summary="Create a PayPal order for the authenticated customer's cart",
        request=CreatePayPalOrderSerializer,
        responses={201: PayPalPaymentSerializer, 400: ErrorResponseSerializer},
        tags=["Checkout"],
    )
    def post(self, request):
        serializer = CreatePayPalOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment, created = create_paypal_order(
            request.user,
            serializer.validated_data["idempotency_key"],
            serializer.validated_data["cart_product_ids"],
        )
        return Response(
            serialize_payment(payment),
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class PayPalOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerOrAdministrator]

    @extend_schema(
        summary="Get a PayPal checkout payment",
        responses={200: PayPalPaymentSerializer, 404: ErrorResponseSerializer},
        tags=["Checkout"],
    )
    def get(self, request, provider_order_id):
        return Response(
            serialize_payment(get_owned_payment(request.user, provider_order_id))
        )


class PayPalOrderCaptureView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerOrAdministrator]

    @extend_schema(
        summary="Capture an approved PayPal order",
        request=None,
        responses={200: PayPalPaymentSerializer, 409: ErrorResponseSerializer},
        tags=["Checkout"],
    )
    def post(self, request, provider_order_id):
        payment = capture_paypal_order(request.user, provider_order_id)
        return Response(serialize_payment(payment))
