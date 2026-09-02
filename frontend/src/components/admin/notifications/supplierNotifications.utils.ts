import type { IAPIError } from '../../../shared/api/models';
import type { ISupplierNotification } from './supplierNotifications.types';
import { ESupplierNotificationType } from './supplierNotifications.types';

export const SUPPLIER_NOTIFICATIONS_PAGE_SIZE = 100;
export const SUPPLIER_NOTIFICATIONS_POLLING_MS = 5000;

export const getSupplierNotificationTitle = (
  notification?: Pick<ISupplierNotification, 'order_id' | 'type'>,
) => {
  if (!notification) {
    return 'Notification';
  }

  if (notification.type === ESupplierNotificationType.CANCELLED_ORDER) {
    return `Order cancellation #${notification.order_id}`;
  }

  return `New order has been received #${notification.order_id}`;
};

export const getSupplierUnreadNotificationsCount = (
  notifications: ISupplierNotification[],
) => notifications.filter((notification) => !notification.is_read).length;

export const formatSupplierNotificationDate = (value?: string) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getSupplierNotificationErrorMessage = (
  error: unknown,
  fallback = 'Notification request failed. Please try again.',
) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;

  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>)
      .flat()
      .filter(Boolean);

    if (messages.length) return messages.join(' ');
  }

  return apiError?.message || fallback;
};
