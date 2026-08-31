import React from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../../../shared/components/product-card/productCard.utils';
import type { IOrder } from '../../orders.store';
import './OrderDetailsPayment.scss';

interface OrderDetailsPaymentProps {
  order: IOrder;
  onContinueShopping: () => void;
}

const OrderDetailsPayment: React.FC<OrderDetailsPaymentProps> = ({
  order,
  onContinueShopping,
}) => (
  <aside className="order-details-payment">
    <h2 className="order-details-payment__title">Payment summary</h2>
    <div className="order-details-payment__line">
      <span className="order-details-payment__label">Items total</span>
      <strong className="order-details-payment__value">{formatPrice(order.total_price)}</strong>
    </div>
    <div className="order-details-payment__line">
      <span className="order-details-payment__label">Pickup</span>
      <strong className="order-details-payment__value">Free</strong>
    </div>
    <div className="order-details-payment__line order-details-payment__total">
      <span className="order-details-payment__label">Total paid</span>
      <strong className="order-details-payment__value">{formatPrice(order.total_price)}</strong>
    </div>
    <AppButton
      className="order-details-payment__continue"
      onClick={onContinueShopping}
    >
      Continue shopping
    </AppButton>
  </aside>
);

export default OrderDetailsPayment;
