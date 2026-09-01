import { EOrderStatus } from './orders.store';

export const formatOrderDate = (value: string) => (
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
);

export const getOrderStatusModifier = (status: EOrderStatus) => {
  switch (status) {
    case EOrderStatus.COMPLETED:
      return 'completed';
    case EOrderStatus.PENDING:
      return 'pending';
    case EOrderStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'default';
  }
};
