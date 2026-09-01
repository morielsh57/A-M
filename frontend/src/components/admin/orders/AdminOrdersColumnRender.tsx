import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppSelect from '../../../shared/components/app-select/AppSelect';
import {
  createRenderColumn,
  type AppTableColumn,
  formatCurrency,
} from '../../../shared/components/app-table/appTable.utils';
import { EUserRole } from '../../../shared/store/user/user.types';
import {
  formatAdminOrderDate,
  getAdminOrderTotal,
  getEditableOrderStatusOptions,
  isAdminOrderStatusSelectDisabled,
} from './adminOrders.utils';
import {
  EAdminOrderStatus,
  type IAdminOrder,
  type IAdminOrdersColumnRenderProps,
} from './adminOrders.types';
import AdminOrderStatusPill from './order-status-pill/AdminOrderStatusPill';

const renderStatusSelect = (
  order: IAdminOrder,
  currentRole: EUserRole | undefined,
  isStatusUpdating: boolean,
  onStatusChange: (order: IAdminOrder, nextStatus: EAdminOrderStatus) => void,
) => (
  <AppSelect
    className="admin-orders-page__status-select"
    disabled={isStatusUpdating || isAdminOrderStatusSelectDisabled(order, currentRole)}
    options={getEditableOrderStatusOptions(currentRole).map((option) => ({
      ...option,
      selectedLabel: <AdminOrderStatusPill status={option.value as EAdminOrderStatus} />,
    }))}
    value={order.order_status}
    onChange={(value) => onStatusChange(order, value as EAdminOrderStatus)}
  />
);

const AdminOrdersColumnRender = ({
  currentRole,
  isStatusUpdating,
  onStatusChange,
  onViewDetails,
}: IAdminOrdersColumnRenderProps): AppTableColumn<IAdminOrder>[] => {
  const columns: AppTableColumn<IAdminOrder>[] = [
    createRenderColumn<IAdminOrder>({
      title: 'Order',
      key: 'order_id',
      fixed: 'left',
      width: 110,
      render: (_, order) => (
        <span className="admin-orders-page__order-id">#{order.order_id}</span>
      ),
    }),
    createRenderColumn<IAdminOrder>({
      title: 'Created',
      key: 'date_created',
      width: 180,
      render: (_, order) => formatAdminOrderDate(order.date_created),
    }),
    createRenderColumn<IAdminOrder>({
      title: 'Products',
      key: 'item_count',
      width: 120,
      render: (_, order) => order.item_count,
    }),
    createRenderColumn<IAdminOrder>({
      title: 'Total',
      key: 'total_price',
      width: 130,
      render: (_, order) => formatCurrency(getAdminOrderTotal(order)),
    }),
    createRenderColumn<IAdminOrder>({
      title: 'Status',
      key: 'order_status',
      width: 180,
      render: (_, order) => renderStatusSelect(
        order,
        currentRole,
        isStatusUpdating,
        onStatusChange,
      ),
    }),
  ];

  if (currentRole === EUserRole.ADMIN) {
    columns.push(
      createRenderColumn<IAdminOrder>({
        title: 'Customer',
        key: 'customer',
        width: 220,
        render: (_, order) => (
          <div className="admin-orders-page__customer">
            <span className="admin-orders-page__customer-name">
              {order.customer_name || 'Unknown customer'}
            </span>
            <span className="admin-orders-page__customer-email">
              {order.customer_email || 'No email'}
            </span>
          </div>
        ),
      }),
    );
  }

  columns.push(
    createRenderColumn<IAdminOrder>({
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, order) => (
        <AppButton
          className="admin-orders-page__details-button"
          title="More info"
          variant="secondary"
          onClick={() => onViewDetails(order)}
        >
          <EyeOutlined /> More info
        </AppButton>
      ),
    }),
  );

  return columns;
};

export default AdminOrdersColumnRender;
