import uuid
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from accounts.models import ADMIN_ROLE, CUSTOMER_ROLE
from carts.models import Cart, CartProduct
from products.models import ProductVariant


GUEST_CART_HEADER = "X-Guest-Cart-ID"


def require_customer(user):
    if (
        not user.is_authenticated
        or user.role.role_name not in {CUSTOMER_ROLE, ADMIN_ROLE}
    ):
        raise PermissionDenied(
            "Only Customer and Admin accounts can use a saved cart."
        )


def create_guest_cart():
    return Cart.objects.create(guest_id=uuid.uuid4(), total_price=Decimal("0"))


def get_customer_cart(user, *, create=False):
    require_customer(user)
    cart = (
        Cart.objects.filter(customer=user, orders__isnull=True)
        .order_by("-date_created")
        .first()
    )
    if cart is None and create:
        cart = Cart.objects.create(customer=user, total_price=Decimal("0"))
    return cart


def parse_guest_cart_id(raw_guest_id):
    if not raw_guest_id:
        raise ValidationError(
            {"guest_cart_id": [f"Provide the guest cart identifier in {GUEST_CART_HEADER}."]}
        )
    try:
        return uuid.UUID(str(raw_guest_id))
    except (TypeError, ValueError, AttributeError) as exc:
        raise ValidationError({"guest_cart_id": ["Guest cart identifier is invalid."]}) from exc


def get_guest_cart(raw_guest_id):
    guest_id = parse_guest_cart_id(raw_guest_id)
    cart = Cart.objects.filter(customer__isnull=True, guest_id=guest_id).first()
    if cart is None:
        raise NotFound("Guest cart was not found.")
    return cart


def get_request_cart(request, *, create_customer=False):
    if request.user.is_authenticated:
        cart = get_customer_cart(request.user, create=create_customer)
        if cart is None:
            raise NotFound("Cart was not found.")
        return cart
    return get_guest_cart(request.headers.get(GUEST_CART_HEADER))


def recalculate_cart_total(cart):
    cart.total_price = (
        cart.cart_products.aggregate(total=Sum("total_price"))["total"]
        or Decimal("0")
    )
    cart.save(update_fields=("total_price", "date_updated"))


def get_cart_item_image(variant):
    color_image = (
        variant.product.images.filter(
            is_active=True,
            variant__color=variant.color,
        )
        .first()
    )
    if color_image:
        return color_image.secure_url

    product_image = variant.product.images.filter(is_active=True, is_primary=True).first()
    if product_image:
        return product_image.secure_url

    product_image = variant.product.images.filter(is_active=True).first()
    return product_image.secure_url if product_image else None


def serialize_cart(cart):
    items = (
        cart.cart_products.select_related("variant__product")
        .prefetch_related("variant__product_images", "variant__product__images")
        .order_by("cart_product_id")
    )
    return {
        "cart_id": cart.cart_id,
        "guest_cart_id": cart.guest_id,
        "total_price": f"{cart.total_price:.2f}",
        "items": [
            {
                "cart_product_id": item.cart_product_id,
                "variant_id": item.variant_id,
                "product_id": item.variant.product_id,
                "product_name": item.variant.product.name,
                "color": item.variant.color,
                "size": item.variant.size,
                "image": get_cart_item_image(item.variant),
                "quantity": item.quantity,
                "available_quantity": item.variant.quantity,
                "unit_price": f"{item.unit_price:.2f}",
                "total_price": f"{item.total_price:.2f}",
            }
            for item in items
        ],
    }


def get_available_variant(variant_id, *, lock=False):
    variants = ProductVariant.objects.select_related("product").filter(
        variant_id=variant_id,
        is_active=True,
        product__is_active=True,
    )
    if lock:
        variants = variants.select_for_update()
    variant = variants.first()
    if variant is None:
        raise NotFound("Product variant was not found.")
    return variant


def validate_stock(variant, quantity):
    if quantity > variant.quantity:
        raise ValidationError(
            {"quantity": ["Requested quantity exceeds available variant quantity."]}
        )


@transaction.atomic
def add_cart_item(cart, variant_id, quantity):
    cart = Cart.objects.select_for_update().get(pk=cart.pk)
    variant = get_available_variant(variant_id, lock=True)
    existing = CartProduct.objects.filter(cart=cart, variant=variant).first()
    requested_quantity = quantity + (existing.quantity if existing else 0)
    validate_stock(variant, requested_quantity)
    unit_price = variant.product.price

    if existing:
        existing.quantity = requested_quantity
        existing.unit_price = unit_price
        existing.total_price = unit_price * requested_quantity
        existing.save(update_fields=("quantity", "unit_price", "total_price"))
    else:
        CartProduct.objects.create(
            cart=cart,
            variant=variant,
            quantity=requested_quantity,
            unit_price=unit_price,
            total_price=unit_price * requested_quantity,
        )
    recalculate_cart_total(cart)
    return cart


@transaction.atomic
def update_cart_item(cart, cart_product_id, quantity):
    cart = Cart.objects.select_for_update().get(pk=cart.pk)
    item = (
        CartProduct.objects.select_for_update()
        .select_related("variant__product")
        .filter(cart=cart, cart_product_id=cart_product_id)
        .first()
    )
    if item is None:
        raise NotFound("Cart item was not found.")
    variant = get_available_variant(item.variant_id, lock=True)
    validate_stock(variant, quantity)
    item.quantity = quantity
    item.unit_price = variant.product.price
    item.total_price = item.unit_price * quantity
    item.save(update_fields=("quantity", "unit_price", "total_price"))
    recalculate_cart_total(cart)
    return cart


@transaction.atomic
def remove_cart_item(cart, cart_product_id):
    cart = Cart.objects.select_for_update().get(pk=cart.pk)
    deleted, _ = CartProduct.objects.filter(
        cart=cart,
        cart_product_id=cart_product_id,
    ).delete()
    if not deleted:
        raise NotFound("Cart item was not found.")
    recalculate_cart_total(cart)
    return cart


@transaction.atomic
def merge_guest_cart(user, guest_cart_id):
    require_customer(user)
    parsed_guest_id = parse_guest_cart_id(guest_cart_id)
    guest_cart = (
        Cart.objects.select_for_update()
        .filter(customer__isnull=True, guest_id=parsed_guest_id)
        .first()
    )
    if guest_cart is None:
        raise NotFound("Guest cart was not found.")

    customer_cart = (
        Cart.objects.filter(customer=user, orders__isnull=True)
        .order_by("-date_created")
        .first()
    )
    if customer_cart is None:
        customer_cart = Cart.objects.create(customer=user, total_price=Decimal("0"))
    customer_cart = Cart.objects.select_for_update().get(pk=customer_cart.pk)

    guest_items = list(
        guest_cart.cart_products.select_related("variant__product").order_by("cart_product_id")
    )
    variant_ids = [item.variant_id for item in guest_items]
    variants = {
        variant.variant_id: variant
        for variant in ProductVariant.objects.select_for_update()
        .select_related("product")
        .filter(variant_id__in=variant_ids)
    }

    for guest_item in guest_items:
        variant = variants.get(guest_item.variant_id)
        if variant is None or not variant.is_active or not variant.product.is_active:
            continue
        customer_item = CartProduct.objects.filter(
            cart=customer_cart,
            variant_id=variant.variant_id,
        ).first()
        combined_quantity = guest_item.quantity + (customer_item.quantity if customer_item else 0)
        merged_quantity = min(combined_quantity, variant.quantity)
        if merged_quantity < 1:
            continue
        unit_price = variant.product.price
        if customer_item:
            customer_item.quantity = merged_quantity
            customer_item.unit_price = unit_price
            customer_item.total_price = unit_price * merged_quantity
            customer_item.save(update_fields=("quantity", "unit_price", "total_price"))
        else:
            CartProduct.objects.create(
                cart=customer_cart,
                variant=variant,
                quantity=merged_quantity,
                unit_price=unit_price,
                total_price=unit_price * merged_quantity,
            )

    guest_cart.delete()
    recalculate_cart_total(customer_cart)
    return customer_cart
