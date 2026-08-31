import React from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../../../shared/components/product-card/productCard.utils';
import { formatOrderDate } from '../../order.utils';
import type { IOrderListItem } from '../../orders.store';
import MyOrdersStatusBadge from '../my-orders-status-badge/MyOrdersStatusBadge';
import './MyOrdersCard.scss';

interface MyOrdersCardProps {
  order: IOrderListItem;
  onViewOrder: (orderId: number) => void;
}

const getItemsLabel = (itemCount: number) => (
  itemCount === 1 ? '1 item' : `${itemCount} items`
);

const MyOrdersCard: React.FC<MyOrdersCardProps> = ({
  order,
  onViewOrder,
}) => (
  <article className="my-orders-card">
    <div className="my-orders-card__main">
      <div className="my-orders-card__identity">
        <span className="my-orders-card__label">Order</span>
        <strong className="my-orders-card__number">#{order.order_id}</strong>
      </div>
      <MyOrdersStatusBadge status={order.order_status} />
    </div>

    <div className="my-orders-card__details">
      <div className="my-orders-card__detail">
        <span className="my-orders-card__detail-label">Date</span>
        <strong className="my-orders-card__detail-value">{formatOrderDate(order.date_created)}</strong>
      </div>
      <div className="my-orders-card__detail">
        <span className="my-orders-card__detail-label">Products</span>
        <strong className="my-orders-card__detail-value">{getItemsLabel(order.item_count)}</strong>
      </div>
      <div className="my-orders-card__detail">
        <span className="my-orders-card__detail-label">Total</span>
        <strong className="my-orders-card__detail-value">{formatPrice(order.total_price)}</strong>
      </div>
    </div>

    <div className="my-orders-card__actions">
      <AppButton
        className="my-orders-card__action"
        onClick={() => onViewOrder(order.order_id)}
      >
        More info
      </AppButton>
    </div>
  </article>
);

export default MyOrdersCard;
