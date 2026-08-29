import React from 'react';
import { PayPalProvider } from '@paypal/react-paypal-js/sdk-v6';
import type { CheckoutPayPalProviderProps } from '../CheckoutPayment.types';
import { PAYPAL_ENVIRONMENT } from '../CheckoutPayment.utils';
import CheckoutPayPalButtons from '../paypal-buttons/CheckoutPayPalButtons';
import './CheckoutPayPalProvider.scss';

const CheckoutPayPalProvider: React.FC<CheckoutPayPalProviderProps> = ({
  isCheckoutReady,
  selectedCartProductIds,
  selectedPickupPointId,
}) => {
  const clientId = import.meta.env.REACT_APP_PAYPAL_CLIENT_ID || '';

  if (!clientId) {
    return (
      <p className="checkout-paypal-provider__error">
        PayPal is not configured. PayPal client id is missing.
      </p>
    );
  }

  return (
    <div className="checkout-paypal-provider">
      <PayPalProvider
        clientId={clientId}
        environment={PAYPAL_ENVIRONMENT}
        components={['paypal-payments']}
        pageType="checkout"
      >
        <CheckoutPayPalButtons
          disabled={!isCheckoutReady}
          selectedCartProductIds={selectedCartProductIds}
          selectedPickupPointId={selectedPickupPointId}
        />
      </PayPalProvider>
    </div>
  );
};

export default CheckoutPayPalProvider;
