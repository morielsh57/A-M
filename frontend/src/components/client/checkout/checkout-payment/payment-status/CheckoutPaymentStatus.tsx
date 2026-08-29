import React from 'react';
import { useAppSelector } from '../../../../../app/store';
import {
  getRequestErrorMessage,
} from '../CheckoutPayment.utils';
import './CheckoutPaymentStatus.scss';

interface CheckoutPaymentStatusProps {
  isCheckoutReady: boolean;
  selectedItemCount: number;
}

const CheckoutPaymentStatus: React.FC<CheckoutPaymentStatusProps> = ({
  isCheckoutReady,
  selectedItemCount,
}) => {
  const {
    createPayPalOrderReq,
    capturePayPalOrderReq,
    createCheckoutOrderReq,
    checkoutSuccessOrder,
    paymentStatusMessage,
    selectedPickupPointId,
  } = useAppSelector((store) => store.checkoutStoreReducer);
  const errorMessage = getRequestErrorMessage(
    createPayPalOrderReq,
    capturePayPalOrderReq,
    createCheckoutOrderReq,
  );

  if (checkoutSuccessOrder) {
    return (
      <div className="checkout-payment-status checkout-payment-status--success" role="status">
        <strong>Payment completed</strong>
        <p>Order #{checkoutSuccessOrder.order_id} was created successfully.</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="checkout-payment-status checkout-payment-status--error" role="alert">
        <strong>Payment could not be completed</strong>
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (paymentStatusMessage) {
    return (
      <div className="checkout-payment-status" role="status">
        <p>{paymentStatusMessage}</p>
      </div>
    );
  }

  if (!isCheckoutReady) {
    return (
      <div className="checkout-payment-status" role="status">
        <p>
          {selectedItemCount === 0
            ? 'Select cart items before payment.'
            : selectedPickupPointId === null
              ? 'Choose a pickup point before payment.'
              : 'Checkout is not ready for payment.'}
        </p>
      </div>
    );
  }

  return null;
};

export default CheckoutPaymentStatus;
