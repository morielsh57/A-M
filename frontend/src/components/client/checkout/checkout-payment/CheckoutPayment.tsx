import React from 'react';
import { useAppSelector } from '../../../../app/store';
import CheckoutPayPalProvider from './paypal-provider/CheckoutPayPalProvider';
import CheckoutPaymentStatus from './payment-status/CheckoutPaymentStatus';
import type { CheckoutPaymentProps } from './CheckoutPayment.types';
import './CheckoutPayment.scss';

const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  hasSelectedItems,
  selectedCartProductIds,
  selectedItemCount,
  total,
}) => {
  const {
    selectedPickupPointId,
    checkoutSuccessOrder,
  } = useAppSelector((store) => store.checkoutStoreReducer);
  const isCheckoutReady = hasSelectedItems && selectedPickupPointId !== null;

  return (
    <section className="checkout-payment" aria-label="PayPal payment">
      <div className="checkout-payment__summary">
        <span>Payable now</span>
        <strong>{total}</strong>
      </div>

      {!checkoutSuccessOrder && (
        <CheckoutPayPalProvider
          isCheckoutReady={isCheckoutReady}
          selectedCartProductIds={selectedCartProductIds}
          selectedPickupPointId={selectedPickupPointId}
        />
      )}

      <CheckoutPaymentStatus
        isCheckoutReady={isCheckoutReady}
        selectedItemCount={selectedItemCount}
      />
    </section>
  );
};

export default CheckoutPayment;
