from django.db import transaction
from django.db.models import F

from accounts.models import Supplier
from notifications.models import Notification


def create_order_notifications(order, notification_type):
    supplier_ids = list(
        order.items.exclude(product__supplier_id__isnull=True)
        .values_list("product__supplier_id", flat=True)
        .distinct()
    )
    for supplier_id in supplier_ids:
        _, created = Notification.objects.get_or_create(
            supplier_id=supplier_id,
            order=order,
            type=notification_type,
        )
        if created:
            Supplier.objects.filter(pk=supplier_id).update(
                unread_counter=F("unread_counter") + 1
            )


@transaction.atomic
def mark_notification_read(supplier, notification):
    notification = Notification.objects.select_for_update().get(
        pk=notification.pk,
        supplier=supplier,
    )
    if notification.is_read:
        return notification

    notification.is_read = True
    notification.save(update_fields=("is_read",))
    Supplier.objects.filter(pk=supplier.pk, unread_counter__gt=0).update(
        unread_counter=F("unread_counter") - 1
    )
    return notification


@transaction.atomic
def mark_all_notifications_read(supplier):
    updated = Notification.objects.filter(supplier=supplier, is_read=False).update(
        is_read=True
    )
    Supplier.objects.filter(pk=supplier.pk).update(unread_counter=0)
    return updated
