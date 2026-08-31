import React from 'react';
import { getOrderStatusModifier } from '../../order.utils';
import { EOrderStatus } from '../../orders.store';
import './MyOrdersStatusBadge.scss';

interface MyOrdersStatusBadgeProps {
  status: EOrderStatus;
}

const MyOrdersStatusBadge: React.FC<MyOrdersStatusBadgeProps> = ({
  status,
}) => {
  const statusClassName = [
    'my-orders-status-badge',
    `my-orders-status-badge--${getOrderStatusModifier(status)}`,
  ].join(' ');

  return (
    <span className={statusClassName}>
      {status}
    </span>
  );
};

export default MyOrdersStatusBadge;
