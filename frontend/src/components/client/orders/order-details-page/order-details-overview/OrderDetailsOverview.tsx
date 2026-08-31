import React from 'react';
import { formatOrderDate, getOrderStatusModifier } from '../../order.utils';
import type { IOrder } from '../../orders.store';
import './OrderDetailsOverview.scss';

interface OrderDetailsOverviewProps {
  order: IOrder;
}

const getStatusClassName = (status: IOrder['order_status']) => [
  'order-details-overview__status',
  `order-details-overview__status--${getOrderStatusModifier(status)}`,
].join(' ');

const OrderDetailsOverview: React.FC<OrderDetailsOverviewProps> = ({
  order,
}) => (
  <section className="order-details-overview">
    <div className="order-details-overview__heading">
      <span className="order-details-overview__order-number">Order #{order.order_id}</span>
      <strong className={getStatusClassName(order.order_status)}>
        {order.order_status}
      </strong>
    </div>

    <div className="order-details-overview__meta">
      <div className="order-details-overview__meta-item">
        <span className="order-details-overview__meta-label">Order date</span>
        <strong className="order-details-overview__meta-value">{formatOrderDate(order.date_created)}</strong>
      </div>
      <div className="order-details-overview__meta-item">
        <span className="order-details-overview__meta-label">Pickup point</span>
        <strong className="order-details-overview__meta-value">
          {order.pickup_point_name || `#${order.pickup_point_id}`}
        </strong>
        {order.pickup_point_address && (
          <small className="order-details-overview__meta-note">
            {order.pickup_point_address}
          </small>
        )}
      </div>
      <div className="order-details-overview__meta-item">
        <span className="order-details-overview__meta-label">Payment</span>
        <strong className="order-details-overview__meta-value">PayPal #{order.payment_id}</strong>
      </div>
    </div>
  </section>
);

export default OrderDetailsOverview;
