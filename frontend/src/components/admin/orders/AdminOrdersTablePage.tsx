import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToast } from '../../../shared/utils/toast.utils';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppSelect from '../../../shared/components/app-select/AppSelect';
import AppTable from '../../../shared/components/app-table/AppTable';
import { EUserRole } from '../../../shared/store/user/user.types';
import AdminOrdersColumnRender from './AdminOrdersColumnRender';
import {
  getAdminOrderById,
  getAdminOrderDetailCacheKey,
  getAdminOrders,
  getAdminOrdersCacheKey,
  updateAdminOrderStatus,
} from './adminOrders.store';
import {
  EAdminOrderStatus,
  type IAdminOrder,
  type IAdminOrdersListRequestParams,
} from './adminOrders.types';
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  getAdminOrderErrorMessage,
} from './adminOrders.utils';
import AdminOrderDetailsDrawer from './order-details-drawer/AdminOrderDetailsDrawer';
import './AdminOrdersTablePage.scss';

const getPositivePage = (value: string | null) => {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const getStatusFromParam = (value: string | null) => (
  Object.values(EAdminOrderStatus).includes(value as EAdminOrderStatus)
    ? value as EAdminOrderStatus
    : undefined
);

const AdminOrdersTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = React.useState<number>();
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = React.useState(false);
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const {
    adminOrderByIdReq,
    adminOrdersByQueryReq,
    updateAdminOrderStatusReq,
  } = useAppSelector((store) => store.adminOrdersStoreReducer);
  const currentRole = adminOrSupplierUser?.role;
  const isAdmin = currentRole === EUserRole.ADMIN;
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const statusValue = searchParams.get('status') || 'all';
  const selectedStatus = getStatusFromParam(searchParams.get('status'));

  const requestParams = useMemo<IAdminOrdersListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
  }), [currentPage, searchValue, selectedStatus]);
  const cacheKey = getAdminOrdersCacheKey(requestParams);
  const ordersReq = adminOrdersByQueryReq[cacheKey];
  const orders = ordersReq?.data || [];
  const pagination = ordersReq?.meta?.pagination;
  const isLoading = !ordersReq || ordersReq.status === EAPIStatus.PENDING;
  const selectedOrderReq = selectedOrderId
    ? adminOrderByIdReq[getAdminOrderDetailCacheKey({ order_id: selectedOrderId })]
    : undefined;
  const selectedOrder = selectedOrderReq?.data || orders.find((order) => (
    order.order_id === selectedOrderId
  ));

  useEffect(() => {
    if (!ordersReq) {
      void dispatch(getAdminOrders(requestParams));
    }
  }, [dispatch, ordersReq, requestParams]);

  const updateUrlParams = (updates: { page?: number; search?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams);

    if (updates.page !== undefined) {
      params.set('page', String(updates.page));
    }

    if (updates.search !== undefined) {
      const search = updates.search.trim();
      search ? params.set('search', search) : params.delete('search');
      params.set('page', '1');
    }

    if (updates.status !== undefined) {
      updates.status === 'all' ? params.delete('status') : params.set('status', updates.status);
      params.set('page', '1');
    }

    navigate(`${APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.ORDERS)}?${params}`);
  };

  const refetch = useCallback(() => {
    void dispatch(getAdminOrders(requestParams));
  }, [dispatch, requestParams]);

  const refetchSelectedOrder = useCallback(() => {
    if (selectedOrderId) {
      void dispatch(getAdminOrderById({ order_id: selectedOrderId }));
    }
  }, [dispatch, selectedOrderId]);

  const openDetailsDrawer = useCallback((order: IAdminOrder) => {
    setSelectedOrderId(order.order_id);
    setIsDetailsDrawerOpen(true);
    const detailKey = getAdminOrderDetailCacheKey({ order_id: order.order_id });
    const detailReq = adminOrderByIdReq[detailKey];
    if (!detailReq || detailReq.status === EAPIStatus.REJECTED) {
      void dispatch(getAdminOrderById({ order_id: order.order_id }));
    }
  }, [adminOrderByIdReq, dispatch]);

  const closeDetailsDrawer = useCallback(() => {
    setIsDetailsDrawerOpen(false);
    setSelectedOrderId(undefined);
  }, []);

  const updateOrderStatus = useCallback(async (
    order: IAdminOrder,
    nextStatus: EAdminOrderStatus,
  ) => {
    if (order.order_status === nextStatus) {
      return;
    }

    const runUpdate = async () => {
      try {
        await dispatch(updateAdminOrderStatus({
          order_id: order.order_id,
          payload: { order_status: nextStatus },
        })).unwrap();
        addToast(`Order #${order.order_id} status updated.`, {
          appearance: 'success',
          autoDismiss: true,
        });
        refetch();
        if (selectedOrderId === order.order_id) {
          refetchSelectedOrder();
        }
      } catch (error) {
        addToast(
          getAdminOrderErrorMessage(error, 'Order status could not be updated. Please try again.'),
          { appearance: 'error', autoDismiss: true },
        );
      }
    };

    if (nextStatus === EAdminOrderStatus.CANCELLED) {
      Modal.confirm({
        title: `Cancel order #${order.order_id}?`,
        content: 'This marks the order as cancelled and updates the reserved stock.',
        okText: 'Cancel order',
        cancelText: 'Keep order',
        okButtonProps: { danger: true },
        onOk: runUpdate,
      });
      return;
    }

    await runUpdate();
  }, [addToast, dispatch, refetch, refetchSelectedOrder, selectedOrderId]);

  const columns = useMemo(() => AdminOrdersColumnRender({
    currentRole,
    isStatusUpdating: updateAdminOrderStatusReq.status === EAPIStatus.PENDING,
    onStatusChange: updateOrderStatus,
    onViewDetails: openDetailsDrawer,
  }), [
    currentRole,
    openDetailsDrawer,
    updateOrderStatus,
    updateAdminOrderStatusReq.status,
  ]);

  return (
    <AdminTablePageLayout
      eyebrow="Orders management"
      title="Users orders"
      subtitle="Review customer orders, supplier fulfillment, payment totals, and order status."
    >
      {ordersReq?.status === EAPIStatus.REJECTED && (
        <Alert
          className="admin-orders-page__error"
          type="error"
          showIcon
          message="Orders could not be loaded"
          description={getAdminOrderErrorMessage(
            ordersReq.error,
            'The orders request failed. Please try again.',
          )}
          action={<AppButton variant="secondary" onClick={refetch}>Try again</AppButton>}
        />
      )}

      <AppTable<IAdminOrder>
        actions={(
          <AppSelect
            className="admin-orders-page__status-filter"
            value={statusValue}
            options={ADMIN_ORDER_STATUS_OPTIONS}
            onChange={(value) => updateUrlParams({ status: String(value) })}
          />
        )}
        columns={columns}
        data={orders}
        emptyText="No orders found."
        loading={isLoading}
        pagination={{
          current: pagination?.page || currentPage,
          pageSize: pagination?.page_size || ADMIN_TABLE_PAGE_SIZE,
          total: pagination?.total_items || orders.length,
          showSizeChanger: false,
          onChange: (page) => updateUrlParams({ page }),
        }}
        rowKey="order_id"
        scroll={{ x: isAdmin ? 1120 : 890 }}
        searchPlaceholder={isAdmin
          ? 'Search orders by order number, customer name, or email...'
          : 'Search your orders by order number or product name...'}
        searchValue={searchValue}
        subtitle="Search and filters are applied across all permitted orders."
        title={isAdmin ? 'All users orders' : 'Your supplier orders'}
        onSearchChange={(search) => updateUrlParams({ search })}
      />

      <AdminOrderDetailsDrawer
        error={selectedOrderReq?.error}
        isAdmin={isAdmin}
        isOpen={isDetailsDrawerOpen}
        loadingStatus={selectedOrderReq?.status}
        order={selectedOrder}
        orderId={selectedOrderId}
        onClose={closeDetailsDrawer}
        onRetry={refetchSelectedOrder}
      />
    </AdminTablePageLayout>
  );
};

export default AdminOrdersTablePage;
