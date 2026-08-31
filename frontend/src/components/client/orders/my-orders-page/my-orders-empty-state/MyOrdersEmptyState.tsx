import React from 'react';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import './MyOrdersEmptyState.scss';

interface MyOrdersEmptyStateProps {
  onContinueShopping: () => void;
}

const MyOrdersEmptyState: React.FC<MyOrdersEmptyStateProps> = ({
  onContinueShopping,
}) => (
  <div className="my-orders-empty-state">
    <h2 className="my-orders-empty-state__title">No orders yet</h2>
    <p className="my-orders-empty-state__message">
      Your future purchases will appear here once checkout is completed.
    </p>
    <AppButton
      className="my-orders-empty-state__action"
      onClick={onContinueShopping}
    >
      Continue shopping
    </AppButton>
  </div>
);

export default MyOrdersEmptyState;
