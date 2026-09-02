import React, { useEffect, useMemo } from 'react';
import { Alert } from 'antd';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AdminTablePageLayout from '../../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../../shared/components/app-button/AppButton';
import { EUserRole } from '../../../../shared/store/user/user.types';
import {
  getAdminOrderById,
  getAdminOrderDetailCacheKey,
} from '../../orders/adminOrders.store';
import {
  getSupplierNotifications,
  markSupplierNotificationRead,
} from '../supplierNotifications.store';
import SupplierNotificationOrderDetails from '../supplier-notification-order-details/SupplierNotificationOrderDetails';
import SupplierNotificationOverview from '../supplier-notification-overview/SupplierNotificationOverview';
import {
  getSupplierNotificationErrorMessage,
  getSupplierNotificationTitle,
  SUPPLIER_NOTIFICATIONS_PAGE_SIZE,
} from '../supplierNotifications.utils';
import './SupplierNotificationDetailsPage.scss';

const getNotificationId = (value?: string) => {
  const notificationId = Number(value);
  return Number.isFinite(notificationId) && notificationId > 0 ? notificationId : undefined;
};

const SupplierNotificationDetailsPage: React.FC = () => {
  const { notificationId: notificationIdParam } = useParams();
  const notificationId = getNotificationId(notificationIdParam);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { adminOrSupplierUser, getCurrentAdminOrSupplierRequest } = useAppSelector(
    (store) => store.userStoreReducer,
  );
  const { supplierNotificationsReq } = useAppSelector(
    (store) => store.supplierNotificationsStoreReducer,
  );
  const { adminOrderByIdReq } = useAppSelector((store) => store.adminOrdersStoreReducer);
  const isSupplier = adminOrSupplierUser?.role === EUserRole.SUPPLIER;
  const isUserLoading = !adminOrSupplierUser && (
    getCurrentAdminOrSupplierRequest.status === EAPIStatus.IDLE
    || getCurrentAdminOrSupplierRequest.status === EAPIStatus.PENDING
  );
  const notifications = supplierNotificationsReq.data || [];
  const notification = useMemo(() => (
    notifications.find((item) => item.notification_id === notificationId)
  ), [notificationId, notifications]);
  const orderReq = notification
    ? adminOrderByIdReq[getAdminOrderDetailCacheKey({ order_id: notification.order_id })]
    : undefined;
  const order = orderReq?.data;

  useEffect(() => {
    if (!isSupplier || supplierNotificationsReq.status === EAPIStatus.PENDING) {
      return;
    }

    if (
      supplierNotificationsReq.status === EAPIStatus.IDLE
      || (
        supplierNotificationsReq.status === EAPIStatus.FULFILLED
        && !supplierNotificationsReq.data
      )
    ) {
      void dispatch(getSupplierNotifications({
        page: 1,
        page_size: SUPPLIER_NOTIFICATIONS_PAGE_SIZE,
      }));
    }
  }, [
    dispatch,
    isSupplier,
    notification,
    supplierNotificationsReq.data,
    supplierNotificationsReq.status,
  ]);

  useEffect(() => {
    if (!isSupplier || !notification || notification.is_read) {
      return;
    }

    void dispatch(markSupplierNotificationRead({
      notification_id: notification.notification_id,
    }));
  }, [dispatch, isSupplier, notification]);

  useEffect(() => {
    if (!isSupplier || !notification) {
      return;
    }

    if (!orderReq || orderReq.status === EAPIStatus.REJECTED) {
      void dispatch(getAdminOrderById({ order_id: notification.order_id }));
    }
  }, [dispatch, isSupplier, notification, orderReq]);

  const retryNotificationRequest = () => {
    void dispatch(getSupplierNotifications({
      page: 1,
      page_size: SUPPLIER_NOTIFICATIONS_PAGE_SIZE,
    }));
  };

  const retryOrderRequest = () => {
    if (notification) {
      void dispatch(getAdminOrderById({ order_id: notification.order_id }));
    }
  };

  if (!notificationId) {
    return <Navigate to={APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.ORDERS)} replace />;
  }

  if (isUserLoading) {
    return (
      <AdminTablePageLayout
        eyebrow="Supplier notifications"
        title="Notification details"
        subtitle="Loading your supplier panel details."
      >
        <div className="supplier-notification-details-page__state">
          <strong>Loading notification...</strong>
        </div>
      </AdminTablePageLayout>
    );
  }

  if (!isSupplier) {
    return <Navigate to={APP_ROUTING_PATHS.ADMIN_HOME_PAGE} replace />;
  }

  const isNotificationLoading = !supplierNotificationsReq.data && (
    supplierNotificationsReq.status === EAPIStatus.IDLE
    || supplierNotificationsReq.status === EAPIStatus.PENDING
  );
  const isNotificationRejected = supplierNotificationsReq.status === EAPIStatus.REJECTED;
  const isNotificationMissing = (
    supplierNotificationsReq.status === EAPIStatus.FULFILLED
    && !notification
  );

  return (
    <AdminTablePageLayout
      eyebrow="Supplier notifications"
      title={getSupplierNotificationTitle(notification)}
      subtitle="Review the notification and the supplier-scoped order details connected to it."
    >
      <div className="supplier-notification-details-page__actions">
        <AppButton
          className="supplier-notification-details-page__back-button"
          type="button"
          variant="secondary"
          onClick={() => navigate(APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.ORDERS))}
        >
          Back to orders
        </AppButton>
      </div>

      {isNotificationLoading && (
        <div className="supplier-notification-details-page__state">
          <strong>Loading notification...</strong>
          <span>Fetching the latest supplier notifications.</span>
        </div>
      )}

      {!isNotificationLoading && isNotificationRejected && (
        <Alert
          className="supplier-notification-details-page__error"
          type="error"
          showIcon
          message="Notification could not be loaded"
          description={getSupplierNotificationErrorMessage(
            supplierNotificationsReq.error,
            'The notification request failed. Please try again.',
          )}
          action={<AppButton variant="secondary" onClick={retryNotificationRequest}>Try again</AppButton>}
        />
      )}

      {!isNotificationLoading && isNotificationMissing && (
        <div className="supplier-notification-details-page__state">
          <strong>Notification was not found.</strong>
          <span>It may be outside the latest notifications list or unavailable for this supplier.</span>
        </div>
      )}

      {notification && (
        <>
          <SupplierNotificationOverview notification={notification} order={order} />
          <SupplierNotificationOrderDetails
            error={orderReq?.error}
            loadingStatus={orderReq?.status}
            order={order}
            onRetry={retryOrderRequest}
          />
        </>
      )}
    </AdminTablePageLayout>
  );
};

export default SupplierNotificationDetailsPage;
