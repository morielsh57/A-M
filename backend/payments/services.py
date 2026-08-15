from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.exceptions import APIException, NotFound, ValidationError

from carts.services import get_available_variant, get_customer_cart, require_customer
from payments.models import Payment, PaymentItem
from payments.paypal import PayPalError, paypal_client


class PaymentProviderUnavailable(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "The payment provider could not complete the request."
    default_code = "payment_provider_error"


class PaymentConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "payment_conflict"


def _provider_call(call, **kwargs):
    try:
        return call(**kwargs)
    except PayPalError as exc:
        raise PaymentProviderUnavailable() from exc


def _approval_url(provider_response):
    return next(
        (
            link.get("href")
            for link in provider_response.get("links", [])
            if link.get("rel") in {"approve", "payer-action"}
        ),
        None,
    )


def serialize_payment(payment):
    items = payment.items.order_by("payment_item_id")
    return {
        "payment_id": payment.payment_id,
        "paypal_order_id": payment.provider_order_id,
        "paypal_capture_id": payment.provider_capture_id,
        "status": payment.status,
        "amount": f"{payment.amount:.2f}",
        "currency": payment.currency,
        "approval_url": _approval_url(payment.provider_response),
        "items": [
            {
                "variant_id": item.variant_id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "color": item.color,
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": f"{item.unit_price:.2f}",
                "total_price": f"{item.total_price:.2f}",
            }
            for item in items
        ],
    }


def get_owned_payment(user, provider_order_id):
    require_customer(user)
    payment = Payment.objects.filter(
        customer=user, provider_order_id=provider_order_id
    ).first()
    if payment is None:
        raise NotFound("Payment was not found.")
    return payment


def _cart_snapshot(user):
    cart = get_customer_cart(user)
    if cart is None:
        raise ValidationError({"cart": ["Cart was not found."]})
    cart_items = list(
        cart.cart_products.select_related("variant__product").order_by("cart_product_id")
    )
    if not cart_items:
        raise ValidationError({"cart": ["The cart is empty."]})

    snapshot = []
    total = Decimal("0.00")
    for item in cart_items:
        variant = get_available_variant(item.variant_id)
        if item.quantity > variant.quantity:
            raise ValidationError(
                {"cart": [f"Variant {variant.variant_id} has insufficient stock."]}
            )
        unit_price = variant.product.price
        line_total = unit_price * item.quantity
        total += line_total
        snapshot.append((variant, item.quantity, unit_price, line_total))
    return cart, snapshot, total


def create_paypal_order(user, idempotency_key):
    require_customer(user)
    existing = Payment.objects.filter(idempotency_key=idempotency_key).first()
    if existing:
        if existing.customer_id != user.user_id:
            raise PaymentConflict("That idempotency key is already in use.")
        return existing, False

    cart, snapshot, total = _cart_snapshot(user)
    provider_response = _provider_call(
        paypal_client.create_order,
        amount=f"{total:.2f}",
        currency=settings.PAYPAL_CURRENCY,
        request_id=str(idempotency_key),
    )
    provider_order_id = provider_response.get("id")
    provider_status = provider_response.get("status")
    if not provider_order_id or provider_status not in {
        Payment.Status.CREATED,
        Payment.Status.PAYER_ACTION_REQUIRED,
        Payment.Status.APPROVED,
    }:
        raise PaymentProviderUnavailable()

    try:
        with transaction.atomic():
            payment = Payment.objects.create(
                customer=user,
                cart=cart,
                provider_order_id=provider_order_id,
                idempotency_key=idempotency_key,
                status=provider_status,
                amount=total,
                currency=settings.PAYPAL_CURRENCY,
                provider_response=provider_response,
            )
            PaymentItem.objects.bulk_create(
                [
                    PaymentItem(
                        payment=payment,
                        product=variant.product,
                        variant=variant,
                        product_name=variant.product.name,
                        color=variant.color,
                        size=variant.size,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=line_total,
                    )
                    for variant, quantity, unit_price, line_total in snapshot
                ]
            )
    except IntegrityError:
        # A concurrent retry can finish after our initial lookup. PayPal uses the
        # same request ID, and the database uniqueness constraint completes the
        # local side of that idempotency guarantee.
        existing = Payment.objects.filter(idempotency_key=idempotency_key).first()
        if existing and existing.customer_id == user.user_id:
            return existing, False
        raise PaymentConflict("That idempotency key is already in use.")
    return payment, True


def _capture_details(response):
    try:
        capture = response["purchase_units"][0]["payments"]["captures"][0]
        amount = Decimal(capture["amount"]["value"])
        currency = capture["amount"]["currency_code"].upper()
        return capture["id"], capture["status"], amount, currency
    except (KeyError, IndexError, TypeError, InvalidOperation) as exc:
        raise PaymentProviderUnavailable() from exc


def capture_paypal_order(user, provider_order_id):
    payment = get_owned_payment(user, provider_order_id)
    if payment.status == Payment.Status.COMPLETED:
        return payment

    response = _provider_call(
        paypal_client.capture_order,
        provider_order_id=payment.provider_order_id,
        request_id=f"capture-{payment.payment_id}",
    )
    capture_id, capture_status, amount, currency = _capture_details(response)

    if (
        response.get("status") != Payment.Status.COMPLETED
        or capture_status != Payment.Status.COMPLETED
    ):
        payment.provider_response = response
        payment.save(update_fields=("provider_response", "date_updated"))
        raise PaymentConflict("The PayPal order has not been completed.")

    if amount != payment.amount or currency != payment.currency:
        payment.status = Payment.Status.FAILED
        payment.provider_response = response
        payment.save(update_fields=("status", "provider_response", "date_updated"))
        raise PaymentConflict("The captured payment amount does not match checkout.")

    payment.provider_capture_id = capture_id
    payment.status = Payment.Status.COMPLETED
    payment.provider_response = response
    payment.save(
        update_fields=(
            "provider_capture_id",
            "status",
            "provider_response",
            "date_updated",
        )
    )
    return payment
