import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AppTitle from '../../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../../shared/components/breadcrumbs/Breadcrumbs';
import {
  EOrderStatus,
  getOrderById,
  getOrderByIdCacheKey,
  type IOrderItem,
} from '../../orders/orders.store';
import {
  createProductReview,
  getProductReviews,
  PRODUCT_REVIEWS_PAGE_SIZE,
  updateReview,
  type IReviewPayload,
} from '../reviews.store';
import ReviewForm from './review-form/ReviewForm';
import ReviewPageState from './review-page-state/ReviewPageState';
import ReviewProductSummary from './review-product-summary/ReviewProductSummary';
import './ReviewPage.scss';

const ReviewPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const { orderId, orderItemId } = useParams<{
    orderId: string;
    orderItemId: string;
  }>();
  const { orderByIdReq } = useAppSelector((store) => store.ordersStoreReducer);
  const { createProductReviewReq, updateReviewReq } = useAppSelector((store) => (
    store.reviewsStoreReducer
  ));
  const orderRequest = orderId ? orderByIdReq[getOrderByIdCacheKey(orderId)] : undefined;
  const order = orderRequest?.data;
  const isLoading = !orderRequest || orderRequest.status === EAPIStatus.PENDING;
  const isSaving = (
    createProductReviewReq.status === EAPIStatus.PENDING
    || updateReviewReq.status === EAPIStatus.PENDING
  );

  useEffect(() => {
    if (!orderId) {
      navigate(APP_ROUTING_PATHS.APP_HOME_PAGE, { replace: true });
      return;
    }

    if (!orderRequest) {
      dispatch(getOrderById(orderId));
    }
  }, [dispatch, navigate, orderId, orderRequest]);

  const orderItem = useMemo<IOrderItem | undefined>(() => (
    order?.items.find((item) => String(item.order_item_id) === String(orderItemId))
  ), [order?.items, orderItemId]);

  const goToOrder = () => {
    if (orderId) {
      navigate(APP_ROUTING_PATHS.APP_ORDER_PAGE(orderId));
      return;
    }
    navigate(APP_ROUTING_PATHS.APP_ORDERS_PAGE());
  };

  const handleSubmit = async (payload: IReviewPayload) => {
    if (!order || !orderItem) return;

    try {
      if (orderItem.review?.review_id) {
        await dispatch(updateReview({
          review_id: orderItem.review.review_id,
          payload,
        })).unwrap();
      } else {
        await dispatch(createProductReview({
          product_id: orderItem.product_id,
          payload: {
            order_id: order.order_id,
            ...payload,
          },
        })).unwrap();
      }

      await dispatch(getOrderById(order.order_id)).unwrap();
      void dispatch(getProductReviews({
        product_id: orderItem.product_id,
        page: 1,
        page_size: PRODUCT_REVIEWS_PAGE_SIZE,
      }));
      addToast(
        orderItem.review ? 'Review updated successfully.' : 'Review added successfully.',
        { appearance: 'success', autoDismiss: true },
      );
      navigate(APP_ROUTING_PATHS.APP_ORDER_PAGE(order.order_id));
    } catch (error) {
      addToast('Review could not be saved. Please try again.', {
        appearance: 'error',
        autoDismiss: true,
      });
    }
  };

  if (isLoading) {
    return (
      <ReviewPageState
        title="Loading review..."
        message="Preparing your purchased item details."
      />
    );
  }

  if (!order || orderRequest?.error || !orderItem) {
    return (
      <ReviewPageState
        isError
        title="Review page could not be loaded"
        message={orderRequest?.error?.message || 'This order item could not be found.'}
        actionLabel="Back to my orders"
        onAction={() => navigate(APP_ROUTING_PATHS.APP_ORDERS_PAGE())}
      />
    );
  }

  if (order.order_status !== EOrderStatus.COMPLETED) {
    return (
      <ReviewPageState
        isError
        title="Review is not available yet"
        message="Reviews can be added only after the order is completed."
        actionLabel="Back to order"
        onAction={goToOrder}
      />
    );
  }

  return (
    <section className="review-page">
      <Breadcrumbs
        linkAr={[
          { to: APP_ROUTING_PATHS.APP_PROFILE_PAGE, name: 'Profile' },
          { to: APP_ROUTING_PATHS.APP_ORDERS_PAGE(), name: 'My Orders' },
          { to: APP_ROUTING_PATHS.APP_ORDER_PAGE(order.order_id), name: `Order #${order.order_id}` },
        ]}
        pageName="Review"
      />
      <AppTitle title={`${orderItem.product_name} - review`} />

      <div className="review-page__content">
        <ReviewProductSummary item={orderItem} />
        <ReviewForm
          initialReview={orderItem.review}
          isSaving={isSaving}
          onCancel={goToOrder}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
};

export default ReviewPage;
