import type { IAPIError } from '../../../shared/api/models';
import { EUserRole } from '../../../shared/store/user/user.types';
import { EAdminOrderStatus, type IAdminOrder } from './adminOrders.types';

export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: EAdminOrderStatus.PENDING, label: 'Pending' },
  { value: EAdminOrderStatus.COMPLETED, label: 'Completed' },
  { value: EAdminOrderStatus.CANCELLED, label: 'Cancelled' },
];

export const getEditableOrderStatusOptions = (role?: EUserRole) => [
  { value: EAdminOrderStatus.PENDING, label: 'Pending' },
  { value: EAdminOrderStatus.COMPLETED, label: 'Completed' },
  {
    value: EAdminOrderStatus.CANCELLED,
    label: 'Cancelled',
    disabled: role !== EUserRole.ADMIN,
  },
];

export const formatAdminOrderDate = (value: string) => (
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
);

export const getAdminOrderTotal = (order: IAdminOrder) => (
  order.total_price ?? order.supplier_total_price ?? 0
);

export const getAdminOrderStatusColor = (status: EAdminOrderStatus) => {
  switch (status) {
    case EAdminOrderStatus.COMPLETED:
      return 'success';
    case EAdminOrderStatus.CANCELLED:
      return 'error';
    case EAdminOrderStatus.PENDING:
      return 'warning';
    default:
      return 'default';
  }
};

export const isOrderStatusEditable = (order: IAdminOrder) => (
  order.order_status === EAdminOrderStatus.PENDING
);

export const isAdminOrderStatusSelectDisabled = (
  order: IAdminOrder,
  role?: EUserRole,
) => (
  role !== EUserRole.ADMIN && !isOrderStatusEditable(order)
);

export const getAdminOrderErrorMessage = (error: unknown, fallback: string) => {
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
