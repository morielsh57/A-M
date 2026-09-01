import React from 'react';
import './MyOrdersState.scss';

interface MyOrdersStateProps {
  title: string;
  message: string;
  isError?: boolean;
}

const MyOrdersState: React.FC<MyOrdersStateProps> = ({
  title,
  message,
  isError = false,
}) => {
  const stateClassName = [
    'my-orders-state',
    isError ? 'my-orders-state--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={stateClassName}>
      <h2 className="my-orders-state__title">{title}</h2>
      <p className="my-orders-state__message">{message}</p>
    </div>
  );
};

export default MyOrdersState;
