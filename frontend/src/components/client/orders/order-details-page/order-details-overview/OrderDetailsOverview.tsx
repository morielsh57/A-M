import React from 'react';
import { EOrderStatus, type ICheckoutOrder } from '../../../checkout/checkout.store';
import './OrderDetailsOverview.scss';

interface OrderDetailsOverviewProps {
  order: ICheckoutOrder;
}

const formatOrderDate = (value: string) => (
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
);

const getStatusClassName = (status: EOrderStatus) => {
  const baseClassName = 'order-details-overview__status';
  switch (status) {
    case EOrderStatus.COMPLETED:
      return `${baseClassName} ${baseClassName}--completed`;
    case EOrderStatus.PENDING:
      return `${baseClassName} ${baseClassName}--pending`;
    case EOrderStatus.CANCELLED:
      return `${baseClassName} ${baseClassName}--cancelled`;
    default:
      return baseClassName;
  }
};

const OrderDetailsOverview: React.FC<OrderDetailsOverviewProps> = ({
  order,
}) => (
  <section className="order-details-overview">
    <div className="order-details-overview__heading">
      <span>Order #{order.order_id}</span>
      <strong className={getStatusClassName(order.order_status)}>
        {order.order_status}
      </strong>
    </div>

    <div className="order-details-overview__meta">
      <div>
        <span>Order date</span>
        <strong>{formatOrderDate(order.date_created)}</strong>
      </div>
      <div>
        <span>Pickup point</span>
        <strong>{order.pickup_point_name || `#${order.pickup_point_id}`}</strong>
        {order.pickup_point_address && <small>{order.pickup_point_address}</small>}
      </div>
      <div>
        <span>Payment</span>
        <strong>PayPal #{order.payment_id}</strong>
      </div>
    </div>
  </section>
);

export default OrderDetailsOverview;
