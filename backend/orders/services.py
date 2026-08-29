from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE
from carts.models import Cart, CartProduct
from payments.models import Payment
from pickup_points.models import PickUpPoint
from orders.models import Order, OrderItem, SupplierOrderFulfillment
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
    payment = (
        Payment.objects.select_for_update()
        .prefetch_related("items")
        .filter(pk=payment_id)
        .first()
    )
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


def create_supplier_fulfillments(order):
    supplier_ids = (
        order.items.exclude(product__supplier_id__isnull=True)
        .values_list("product__supplier_id", flat=True)
        .distinct()
    )
    for supplier_id in supplier_ids:
        SupplierOrderFulfillment.objects.get_or_create(
            order=order,
            supplier_id=supplier_id,
            defaults={"status": order.order_status},
        )


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

            cart = Cart.objects.select_for_update().filter(
                pk=payment.cart_id,
                customer=customer,
            ).first()
            if cart is None:
                raise ValidationError({"cart": ["The shopping cart is empty."]})

            payment_items = list(
                payment.items.select_related("variant__product")
                .order_by("payment_item_id")
            )
            if not payment_items:
                raise ValidationError({"payment_id": ["Payment has no items."]})

            variants = {
                variant.variant_id: variant
                for variant in ProductVariant.objects.select_for_update()
                .select_related("product")
                .filter(variant_id__in=[item.variant_id for item in payment_items])
            }
            order_total = Decimal("0")

            for payment_item in payment_items:
                variant = variants.get(payment_item.variant_id)
                if variant is None or not variant.is_active or not variant.product.is_active:
                    raise ValidationError(
                        {"cart": [f"Variant {payment_item.variant_id} is no longer available."]}
                    )
                if payment_item.quantity > variant.quantity:
                    raise ValidationError(
                        {
                            "quantity": [
                                f"Requested quantity for variant {variant.variant_id} "
                                "exceeds available stock."
                            ]
                        }
                    )
                order_total += payment_item.total_price

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
                        product=payment_item.product,
                        variant=payment_item.variant,
                        product_name=payment_item.product_name,
                        color=payment_item.color,
                        size=payment_item.size,
                        quantity=payment_item.quantity,
                        unit_price=payment_item.unit_price,
                        total_price=payment_item.total_price,
                    )
                    for payment_item in payment_items
                ]
            )
            create_supplier_fulfillments(order)
            from notifications.models import Notification
            from notifications.services import create_order_notifications

            create_order_notifications(order, Notification.Type.NEW_ORDER)
            purchased_variant_ids = [item.variant_id for item in payment_items]
            for payment_item in payment_items:
                ProductVariant.objects.filter(pk=payment_item.variant_id).update(
                    quantity=F("quantity") - payment_item.quantity
                )
            remaining_cart_items = list(
                CartProduct.objects.select_for_update()
                .filter(cart=cart)
                .exclude(variant_id__in=purchased_variant_ids)
                .order_by("cart_product_id")
            )
            if remaining_cart_items:
                remaining_cart = Cart.objects.create(
                    customer=customer,
                    total_price=sum(
                        (item.total_price for item in remaining_cart_items),
                        Decimal("0"),
                    ),
                )
                CartProduct.objects.bulk_create(
                    [
                        CartProduct(
                            cart=remaining_cart,
                            variant=item.variant,
                            quantity=item.quantity,
                            unit_price=item.unit_price,
                            total_price=item.total_price,
                        )
                        for item in remaining_cart_items
                    ]
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
    if next_status == Order.Status.COMPLETED:
        SupplierOrderFulfillment.objects.filter(order=order).update(
            status=SupplierOrderFulfillment.Status.COMPLETED,
            date_updated=timezone.now(),
        )
    elif next_status == Order.Status.CANCELLED:
        SupplierOrderFulfillment.objects.filter(order=order).update(
            status=SupplierOrderFulfillment.Status.CANCELLED,
            date_updated=timezone.now(),
        )
        from notifications.models import Notification
        from notifications.services import create_order_notifications

        create_order_notifications(order, Notification.Type.CANCELLED_ORDER)
    return order


@transaction.atomic
def transition_supplier_fulfillment(fulfillment, next_status):
    fulfillment = SupplierOrderFulfillment.objects.select_for_update().select_related(
        "order"
    ).get(pk=fulfillment.pk)
    if fulfillment.status == next_status:
        return fulfillment
    if fulfillment.status != SupplierOrderFulfillment.Status.PENDING or (
        next_status != SupplierOrderFulfillment.Status.COMPLETED
    ):
        raise ValidationError(
            {
                "order_status": [
                    f"Supplier order status cannot change from "
                    f"{fulfillment.status} to {next_status}."
                ]
            }
        )
    if fulfillment.order.order_status != Order.Status.PENDING:
        raise ValidationError(
            {"order_status": ["The overall order is no longer pending."]}
        )

    fulfillment.status = next_status
    fulfillment.save(update_fields=("status", "date_updated"))
    has_incomplete = SupplierOrderFulfillment.objects.filter(
        order=fulfillment.order,
    ).exclude(status=SupplierOrderFulfillment.Status.COMPLETED).exists()
    if not has_incomplete:
        transition_order_status(fulfillment.order, Order.Status.COMPLETED)
    return fulfillment


def cancel_customer_order(customer, order_id):
    order = get_customer_order(customer, order_id)
    return transition_order_status(order, Order.Status.CANCELLED)
