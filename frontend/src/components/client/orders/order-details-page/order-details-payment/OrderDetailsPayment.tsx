import React from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../../../shared/components/product-card/productCard.utils';
import type { ICheckoutOrder } from '../../../checkout/checkout.store';
import './OrderDetailsPayment.scss';

interface OrderDetailsPaymentProps {
  order: ICheckoutOrder;
  onContinueShopping: () => void;
}

const OrderDetailsPayment: React.FC<OrderDetailsPaymentProps> = ({
  order,
  onContinueShopping,
}) => (
  <aside className="order-details-payment">
    <h2>Payment summary</h2>
    <div>
      <span>Items total</span>
      <strong>{formatPrice(order.total_price)}</strong>
    </div>
    <div>
      <span>Pickup</span>
      <strong>Free</strong>
    </div>
    <div className="order-details-payment__total">
      <span>Total paid</span>
      <strong>{formatPrice(order.total_price)}</strong>
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
