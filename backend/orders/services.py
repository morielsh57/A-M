from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import F
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE
from carts.models import Cart, CartProduct
from orders.models import Order, OrderItem
from payments.models import Payment
from pickup_points.models import PickUpPoint
from products.models import ProductVariant


def require_customer(user):
    if (
        not user.is_authenticated
        or user.role.role_name not in {CUSTOMER_ROLE, ADMIN_ROLE}
    ):
        raise PermissionDenied(
            "Only Customer and Admin accounts can manage customer orders."
        )


def get_customer_order(user, order_id, *, lock=False):
    require_customer(user)
    orders = Order.objects.filter(customer=user, order_id=order_id)
    if lock:
        orders = orders.select_for_update()
    order = orders.first()
    if order is None:
        raise NotFound("Order was not found.")
    return order


def _get_existing_payment_order(customer, payment_id):
    order = Order.objects.filter(payment_id=payment_id).first()
    if order is None:
        return None
    if order.customer_id != customer.pk:
        raise ValidationError(
            {"payment_id": ["This payment confirmation has already been used."]}
        )
    return order


def _get_completed_payment(customer, payment_id):
    payment = Payment.objects.select_for_update().filter(pk=payment_id).first()
    if payment is None:
        raise ValidationError({"payment_id": ["Payment was not found."]})
    if payment.customer_id != customer.pk:
        raise ValidationError({"payment_id": ["Payment does not belong to this customer."]})
    if payment.status != Payment.Status.COMPLETED:
        raise ValidationError({"payment_id": ["Payment must be completed before creating an order."]})
    return payment


def _get_active_pickup_point(pickup_point_id):
    pickup_point = PickUpPoint.objects.filter(pk=pickup_point_id, is_active=True).first()
    if pickup_point is None:
        raise ValidationError({"pickup_point_id": ["Pickup point was not found or is inactive."]})
    return pickup_point


def create_order_from_cart(customer, payment_id, pickup_point_id):
    require_customer(customer)
    existing = _get_existing_payment_order(customer, payment_id)
    if existing is not None:
        return existing, False

    try:
        with transaction.atomic():
            payment = _get_completed_payment(customer, payment_id)
            pickup_point = _get_active_pickup_point(pickup_point_id)
            existing = _get_existing_payment_order(customer, payment.payment_id)
            if existing is not None:
                return existing, False

            cart = (
                Cart.objects.select_for_update()
                .filter(pk=payment.cart_id, customer=customer, orders__isnull=True)
                .order_by("-date_created")
                .first()
            )
            if cart is None:
                raise ValidationError({"cart": ["The shopping cart is empty."]})

            cart_items = list(
                CartProduct.objects.select_for_update()
                .select_related("variant__product")
                .filter(cart=cart)
                .order_by("cart_product_id")
            )
            if not cart_items:
                raise ValidationError({"cart": ["The shopping cart is empty."]})

            variants = {
                variant.variant_id: variant
                for variant in ProductVariant.objects.select_for_update()
                .select_related("product")
                .filter(variant_id__in=[item.variant_id for item in cart_items])
            }
            order_total = Decimal("0")
            snapshots = []

            for cart_item in cart_items:
                variant = variants.get(cart_item.variant_id)
                if variant is None or not variant.is_active or not variant.product.is_active:
                    raise ValidationError(
                        {"cart": [f"Variant {cart_item.variant_id} is no longer available."]}
                    )
                if cart_item.quantity > variant.quantity:
                    raise ValidationError(
                        {
                            "quantity": [
                                f"Requested quantity for variant {variant.variant_id} "
                                "exceeds available stock."
                            ]
                        }
                    )
                unit_price = variant.product.price
                item_total = unit_price * cart_item.quantity
                order_total += item_total
                snapshots.append((cart_item, variant, unit_price, item_total))

            if order_total != payment.amount:
                raise ValidationError(
                    {"payment_id": ["Payment amount does not match the current checkout total."]}
                )

            order = Order.objects.create(
                cart=cart,
                payment=payment,
                pickup_point=pickup_point,
                customer=customer,
                total_price=order_total,
            )
            OrderItem.objects.bulk_create(
                [
                    OrderItem(
                        order=order,
                        product=variant.product,
                        variant=variant,
                        product_name=variant.product.name,
                        color=variant.color,
                        size=variant.size,
                        quantity=cart_item.quantity,
                        unit_price=unit_price,
                        total_price=item_total,
                    )
                    for cart_item, variant, unit_price, item_total in snapshots
                ]
            )
            for cart_item, variant, _, _ in snapshots:
                ProductVariant.objects.filter(pk=variant.pk).update(
                    quantity=F("quantity") - cart_item.quantity
                )
            CartProduct.objects.filter(cart=cart).delete()
            cart.total_price = Decimal("0")
            cart.save(update_fields=("total_price", "date_updated"))
            return order, True
    except IntegrityError:
        existing = _get_existing_payment_order(customer, payment_id)
        if existing is not None:
            return existing, False
        raise


@transaction.atomic
def transition_order_status(order, next_status):
    order = Order.objects.select_for_update().get(pk=order.pk)
    current_status = order.order_status
    if next_status == current_status:
        return order

    allowed = {
        Order.Status.PENDING: {Order.Status.COMPLETED, Order.Status.CANCELLED},
        Order.Status.COMPLETED: set(),
        Order.Status.CANCELLED: set(),
    }
    if next_status not in allowed[current_status]:
        raise ValidationError(
            {
                "order_status": [
                    f"Order status cannot change from {current_status} to {next_status}."
                ]
            }
        )

    if next_status == Order.Status.CANCELLED:
        items = list(order.items.select_related("variant").order_by("order_item_id"))
        list(
            ProductVariant.objects.select_for_update()
            .filter(variant_id__in=[item.variant_id for item in items])
            .values_list("variant_id", flat=True)
        )
        for item in items:
            ProductVariant.objects.filter(pk=item.variant_id).update(
                quantity=F("quantity") + item.quantity
            )

    order.order_status = next_status
    order.save(update_fields=("order_status", "date_updated"))
    return order


def cancel_customer_order(customer, order_id):
    order = get_customer_order(customer, order_id)
    return transition_order_status(order, Order.Status.CANCELLED)
