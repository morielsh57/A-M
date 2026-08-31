import React from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import './OrderDetailsState.scss';

interface OrderDetailsStateProps {
  title: string;
  message: string;
  isError?: boolean;
  onContinueShopping?: () => void;
}

const OrderDetailsState: React.FC<OrderDetailsStateProps> = ({
  title,
  message,
  isError = false,
  onContinueShopping,
}) => (
  <div className={[
    'order-details-state',
    isError ? 'order-details-state--error' : '',
  ].filter(Boolean).join(' ')}
  >
    <h2 className="order-details-state__title">{title}</h2>
    <p className="order-details-state__message">{message}</p>
    {onContinueShopping && (
      <AppButton className="order-details-state__action" onClick={onContinueShopping}>
        Continue shopping
      </AppButton>
    )}
  </div>
);

export default OrderDetailsState;
