import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AppTitle from '../../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../../shared/components/breadcrumbs/Breadcrumbs';
import { getProductDetail, getProductDetailCacheKey } from '../../../product-page/product.store';
import { EOrderStatus, getOrderById, getOrderByIdCacheKey } from '../orders.store';
import OrderDetailsItems from './order-details-items/OrderDetailsItems';
import OrderDetailsOverview from './order-details-overview/OrderDetailsOverview';
import OrderDetailsPayment from './order-details-payment/OrderDetailsPayment';
import OrderDetailsState from './order-details-state/OrderDetailsState';
import './OrderDetailsPage.scss';

const OrderDetailsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { orderByIdReq } = useAppSelector((store) => store.ordersStoreReducer);
  const { productDetailByProductReq } = useAppSelector((store) => (
    store.productPageStoreReducer
  ));
  const orderRequest = orderId ? orderByIdReq[getOrderByIdCacheKey(orderId)] : undefined;
  const order = orderRequest?.data;
  const isLoading = !orderRequest || orderRequest.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!orderId) {
      navigate(APP_ROUTING_PATHS.APP_HOME_PAGE, { replace: true });
      return;
    }

    if (!orderRequest) {
      dispatch(getOrderById(orderId));
    }
  }, [dispatch, navigate, orderId, orderRequest]);

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
      const image = item.image_url || variantImage || primaryImage || fallbackImage;

      if (image) {
        imagesByVariantId.set(String(item.variant_id), image);
      }
    });
    return imagesByVariantId;
  }, [order?.items, productDetailByProductReq]);

  const handleContinueShopping = () => {
    navigate(APP_ROUTING_PATHS.APP_HOME_PAGE);
  };

  const handleReviewItem = (orderItemId: string | number) => {
    if (!orderId) return;
    navigate(APP_ROUTING_PATHS.APP_ORDER_ITEM_REVIEW_PAGE(orderId, orderItemId));
  };

  if (isLoading) {
    return (
      <OrderDetailsState
        title="Loading order..."
        message="Preparing your order details."
      />
    );
  }

  if (!order || orderRequest?.error) {
    return (
      <OrderDetailsState
        isError
        title="Order details could not be loaded"
        message={orderRequest?.error?.message || 'Please continue shopping and try again later.'}
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
  };

  return (
    <div className="order-details-page">
      <Breadcrumbs
        linkAr={[
          {
            to: APP_ROUTING_PATHS.APP_ORDERS_PAGE(),
            name: 'My Orders',
          },
        ]}
        pageName={`Order #${order.order_id}`}
      />
      <div className="order-details-page__title">
        <AppTitle title="Order Details" />
        <p className="order-details-page__subtitle">{getOrderDetailsSubTitle()}</p>
      </div>

      <div className="order-details-page__layout">
        <main className="order-details-page__main">
          <OrderDetailsOverview order={order} />
          <OrderDetailsItems
            order={order}
            itemImages={itemImages}
            onReviewItem={handleReviewItem}
          />
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
