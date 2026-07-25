import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

type PayPalButtonProps = {
  amount: string;
  currency?: string;
  onSuccess?: (details: unknown, data: { orderID?: string }) => void;
  options?: {
    clientId?: string;
  };
};

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  options,
}) => {
  const clientId = options?.clientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

  if (!clientId) {
    return null;
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency }}>
      <PayPalButtons
        createOrder={(_data, actions) =>
          actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  value: amount,
                  currency_code: currency,
                },
              },
            ],
          })
        }
        onApprove={(data, actions) =>
          actions.order!.capture().then((details) => {
            onSuccess?.(details, { orderID: data.orderID });
          })
        }
      />
    </PayPalScriptProvider>
  );
};
