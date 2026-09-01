import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PayPalOneTimePaymentButton,
  type OnApproveDataOneTimePayments,
  type OnCancelDataOneTimePayments,
  type OnErrorData,
} from '@paypal/react-paypal-js/sdk-v6';
import { APP_ROUTING_PATHS } from '../../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../../app/store';
import { getCart, keepNextCartSyncUnselected } from '../../../cart/cart.store';
import {
  clearMyOrdersCache,
  getMyOrders,
  MY_ORDERS_PAGE_SIZE,
  setOrderById,
} from '../../../orders/orders.store';
import {
  capturePayPalOrder,
  createCheckoutOrder,
  createPayPalOrder,
  setPaymentStatusMessage,
} from '../../checkout.store';
import type { CheckoutPayPalButtonsProps } from '../CheckoutPayment.types';
import {
  createCheckoutIdempotencyKey,
  isRequestPending,
} from '../CheckoutPayment.utils';
import './CheckoutPayPalButtons.scss';

const CheckoutPayPalButtons: React.FC<CheckoutPayPalButtonsProps> = ({
  disabled,
  selectedCartProductIds,
  selectedPickupPointId,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    createPayPalOrderReq,
    capturePayPalOrderReq,
    createCheckoutOrderReq,
  } = useAppSelector((store) => store.checkoutStoreReducer);
  const idempotencyKeyRef = useRef<string>();
  const paypalOrderIdRef = useRef<string>();
  const isProcessing = [
    createPayPalOrderReq,
    capturePayPalOrderReq,
    createCheckoutOrderReq,
  ].some(isRequestPending);

  const createOrder = async () => {
    const selectedIds = selectedCartProductIds.map(Number).filter(Number.isFinite);

    if (disabled || selectedPickupPointId === null) {
      throw new Error('Choose a pickup point before starting PayPal payment.');
    }
    if (selectedIds.length === 0) {
      throw new Error('Select at least one cart item before starting PayPal payment.');
    }

    idempotencyKeyRef.current = idempotencyKeyRef.current || createCheckoutIdempotencyKey();
    dispatch(setPaymentStatusMessage('Creating PayPal payment...'));
    const payment = await dispatch(createPayPalOrder({
      idempotency_key: idempotencyKeyRef.current,
      cart_product_ids: selectedIds,
    })).unwrap();
    paypalOrderIdRef.current = payment.paypal_order_id;

    return { orderId: payment.paypal_order_id };
  };

  const handleApprove = async (data: OnApproveDataOneTimePayments) => {
    const paypalOrderId = paypalOrderIdRef.current || data.orderId;

    if (!paypalOrderId || selectedPickupPointId === null) {
      throw new Error('PayPal approval could not be matched to this checkout.');
    }

    dispatch(setPaymentStatusMessage('Capturing PayPal payment...'));
    const payment = await dispatch(capturePayPalOrder({
      paypal_order_id: paypalOrderId,
    })).unwrap();

    if (payment.status !== 'COMPLETED') {
      throw new Error('PayPal payment was not completed.');
    }

    dispatch(setPaymentStatusMessage('Creating your order...'));
    const order = await dispatch(createCheckoutOrder({
      payment_id: payment.payment_id,
      pickup_point_id: selectedPickupPointId,
    })).unwrap();
    idempotencyKeyRef.current = undefined;
    paypalOrderIdRef.current = undefined;
    dispatch(setPaymentStatusMessage(undefined));
    dispatch(setOrderById(order));
    dispatch(clearMyOrdersCache());
    dispatch(getMyOrders({ page: 1, page_size: MY_ORDERS_PAGE_SIZE }));
    dispatch(keepNextCartSyncUnselected());
    dispatch(getCart());
    navigate(APP_ROUTING_PATHS.APP_ORDER_PAGE(order.order_id), { replace: true });
  };

  const handleCancel = (_data: OnCancelDataOneTimePayments) => {
    idempotencyKeyRef.current = undefined;
    paypalOrderIdRef.current = undefined;
    dispatch(setPaymentStatusMessage('PayPal payment was cancelled. You can try again when ready.'));
  };

  const handleError = (error: OnErrorData) => {
    idempotencyKeyRef.current = undefined;
    paypalOrderIdRef.current = undefined;
    dispatch(setPaymentStatusMessage(error.message || 'PayPal payment failed. Please try again.'));
  };

  return (
    <div className="checkout-paypal-buttons">
      <PayPalOneTimePaymentButton
        type="pay"
        commit
        disabled={disabled || isProcessing}
        createOrder={createOrder}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onError={handleError}
      />
    </div>
  );
};

export default CheckoutPayPalButtons;
