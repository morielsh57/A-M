from decimal import Decimal

from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from carts.models import Cart, CartProduct
from carts.serializers import AddCartItemSerializer, CartItemResponseSerializer
from config.api.serializers import ErrorResponseSerializer
from products.models import ProductVariant


def serialize_cart_item(cart_product):
    return {
        "cart_product_id": cart_product.cart_product_id,
        "cart_id": cart_product.cart_id,
        "variant_id": cart_product.variant_id,
        "product_id": cart_product.variant.product_id,
        "quantity": cart_product.quantity,
        "unit_price": cart_product.unit_price,
        "total_price": cart_product.total_price,
    }


def recalculate_cart_total(cart):
    cart.total_price = (
        CartProduct.objects
        .filter(cart=cart)
        .aggregate(total=Sum("total_price"))["total"]
        or Decimal("0")
    )
    cart.save(update_fields=["total_price"])


class CartItemView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Add a variant to the current cart",
        description=(
            "Authenticated endpoint. Adds or updates a cart item by variant_id. "
            "The requested quantity cannot exceed the variant quantity."
        ),
        request=AddCartItemSerializer,
        responses={
            201: CartItemResponseSerializer,
            400: ErrorResponseSerializer,
            401: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=["Cart"],
    )
    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = ProductVariant.objects.select_related("product").filter(
            variant_id=serializer.validated_data["variant_id"],
            is_active=True,
            product__is_active=True,
        ).first()
        if variant is None:
            raise NotFound("Product variant was not found.")

        requested_quantity = serializer.validated_data["quantity"]
        if requested_quantity > variant.quantity:
            raise ValidationError(
                {"quantity": ["Requested quantity exceeds available variant quantity."]}
            )

        cart = Cart.objects.filter(customer=request.user).order_by("-date_created").first()
        if cart is None:
            cart = Cart.objects.create(customer=request.user, total_price=Decimal("0"))

        unit_price = variant.product.price
        total_price = unit_price * requested_quantity
        cart_product, created = CartProduct.objects.update_or_create(
            cart=cart,
            variant=variant,
            defaults={
                "quantity": requested_quantity,
                "unit_price": unit_price,
                "total_price": total_price,
            },
        )
        recalculate_cart_total(cart)

        return Response(
            serialize_cart_item(cart_product),
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
