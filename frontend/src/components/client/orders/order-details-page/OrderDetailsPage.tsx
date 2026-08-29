import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AppTitle from '../../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../../shared/components/breadcrumbs/Breadcrumbs';
import { getProductDetail, getProductDetailCacheKey } from '../../../product-page/product.store';
import { EOrderStatus, getCheckoutOrder } from '../../checkout/checkout.store';
import OrderDetailsItems from './order-details-items/OrderDetailsItems';
import OrderDetailsOverview from './order-details-overview/OrderDetailsOverview';
import OrderDetailsPayment from './order-details-payment/OrderDetailsPayment';
import OrderDetailsState from './order-details-state/OrderDetailsState';
import './OrderDetailsPage.scss';

const OrderDetailsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { checkoutSuccessOrder, getCheckoutOrderReq } = useAppSelector((store) => (
    store.checkoutStoreReducer
  ));
  const { productDetailByProductReq } = useAppSelector((store) => (
    store.productPageStoreReducer
  ));
  const fetchedOrder = getCheckoutOrderReq.data;
  const order = checkoutSuccessOrder && String(checkoutSuccessOrder.order_id) === String(orderId)
    ? checkoutSuccessOrder
    : fetchedOrder && String(fetchedOrder.order_id) === String(orderId)
      ? fetchedOrder
      : undefined;
  const isLoading = getCheckoutOrderReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!orderId) {
      navigate(APP_ROUTING_PATHS.APP_HOME_PAGE, { replace: true });
      return;
    }

    if (!order || String(order.order_id) !== String(orderId)) {
      dispatch(getCheckoutOrder(orderId));
    }
  }, [dispatch, navigate, order, orderId]);

  useEffect(() => {
    order?.items.forEach((item) => {
      const key = getProductDetailCacheKey({ product_id: item.product_id });
      const request = productDetailByProductReq[key];
      if (!request || request.status === EAPIStatus.IDLE || request.status === EAPIStatus.REJECTED) {
        dispatch(getProductDetail({ product_id: item.product_id }));
      }
    });
  }, [dispatch, order?.items, productDetailByProductReq]);

  const itemImages = useMemo(() => {
    const imagesByVariantId = new Map<string, string>();
    order?.items.forEach((item) => {
      const product = productDetailByProductReq[
        getProductDetailCacheKey({ product_id: item.product_id })
      ]?.data;
      const variantImage = product?.variants
        .find((variant) => String(variant.variant_id) === String(item.variant_id))
        ?.images.find(Boolean);
      const primaryImage = product?.images?.find((image) => image.is_primary && image.secure_url)
        ?.secure_url;
      const fallbackImage = product?.images?.find((image) => image.secure_url)?.secure_url;
      const image = variantImage || primaryImage || fallbackImage;

      if (image) {
        imagesByVariantId.set(String(item.variant_id), image);
      }
    });
    return imagesByVariantId;
  }, [order?.items, productDetailByProductReq]);

  const handleContinueShopping = () => {
    navigate(APP_ROUTING_PATHS.APP_HOME_PAGE);
  };

  if (isLoading || (!order && !getCheckoutOrderReq.error)) {
    return (
      <OrderDetailsState
        title="Loading order..."
        message="Preparing your order summary."
      />
    );
  }

  if (!order || getCheckoutOrderReq.error) {
    return (
      <OrderDetailsState
        isError
        title="Order summary could not be loaded"
        message={getCheckoutOrderReq.error?.message || 'Please continue shopping and try again later.'}
        onContinueShopping={handleContinueShopping}
      />
    );
  }


  const getOrderDetailsSubTitle = () => {
    switch (order.order_status) {
      case EOrderStatus.PENDING:
        return 'Your payment was completed and your order is ready for processing ✨';
      case EOrderStatus.COMPLETED:
        return 'Your order has been received. Thank you for shopping with us!❤️';
      case EOrderStatus.CANCELLED:
        return 'Your order has been cancelled. Please contact support for more information.';
      default:
        return '';
    }
  }

  return (
    <div className="order-details-page">
      <Breadcrumbs
        pageName={`Order #${order.order_id}`}
      />
      <div className="order-details-page__title">
        <AppTitle title="Order Confirmed" />
        <p>{getOrderDetailsSubTitle()}</p>
      </div>

      <div className="order-details-page__layout">
        <main className="order-details-page__main">
          <OrderDetailsOverview order={order} />
          <OrderDetailsItems order={order} itemImages={itemImages} />
        </main>

        <OrderDetailsPayment
          order={order}
          onContinueShopping={handleContinueShopping}
        />
      </div>
    </div>
  );
};

export default OrderDetailsPage;
