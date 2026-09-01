import React from 'react';
import { Alert, Tag } from 'antd';
import AdminFormDrawer from '../../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AppButton from '../../../../shared/components/app-button/AppButton';
import { formatCurrency } from '../../../../shared/components/app-table/appTable.utils';
import { EAPIStatus, type IAPIError } from '../../../../shared/api/models';
import {
  formatAdminOrderDate,
  getAdminOrderErrorMessage,
  getAdminOrderStatusColor,
  getAdminOrderTotal,
} from '../adminOrders.utils';
import type { IAdminOrder } from '../adminOrders.types';
import './AdminOrderDetailsDrawer.scss';

interface AdminOrderDetailsDrawerProps {
  error?: IAPIError;
  isAdmin: boolean;
  isOpen: boolean;
  loadingStatus?: EAPIStatus;
  order?: IAdminOrder;
  orderId?: number;
  onClose: () => void;
  onRetry: () => void;
}

const AdminOrderDetailsDrawer: React.FC<AdminOrderDetailsDrawerProps> = ({
  error,
  isAdmin,
  isOpen,
  loadingStatus,
  order,
  orderId,
  onClose,
  onRetry,
}) => {
  const isLoading = loadingStatus === EAPIStatus.PENDING;
  const title = order?.order_id || orderId ? (
    <>
      Order <span className="admin-form-drawer__title-accent">#{order?.order_id || orderId}</span>
    </>
  ) : 'Order details';

  return (
    <AdminFormDrawer
      isOpen={isOpen}
      title={title}
      subtitle="Review order information, products, pickup details, and status."
      onClose={onClose}
    >
      <div className="admin-order-details-drawer">
        {isLoading && (
          <div className="admin-order-details-drawer__state">
            <strong className="admin-order-details-drawer__state-title">Loading order...</strong>
            <span className="admin-order-details-drawer__state-message">Preparing full order details.</span>
          </div>
        )}

        {!isLoading && error && (
          <Alert
            className="admin-order-details-drawer__error"
            type="error"
            showIcon
            message="Order could not be loaded"
            description={getAdminOrderErrorMessage(error, 'The order request failed. Please try again.')}
            action={<AppButton variant="secondary" onClick={onRetry}>Try again</AppButton>}
          />
        )}

        {!isLoading && !error && order && (
          <>
            <section className="admin-order-details-drawer__section">
              <div className="admin-order-details-drawer__summary">
                <div className="admin-order-details-drawer__summary-item">
                  <span className="admin-order-details-drawer__label">Status</span>
                  <Tag color={getAdminOrderStatusColor(order.order_status)}>
                    {order.order_status}
                  </Tag>
                </div>
                <div className="admin-order-details-drawer__summary-item">
                  <span className="admin-order-details-drawer__label">Total</span>
                  <strong className="admin-order-details-drawer__value">
                    {formatCurrency(getAdminOrderTotal(order))}
                  </strong>
                </div>
                <div className="admin-order-details-drawer__summary-item">
                  <span className="admin-order-details-drawer__label">Products</span>
                  <strong className="admin-order-details-drawer__value">{order.item_count}</strong>
                </div>
              </div>
            </section>

            <section className="admin-order-details-drawer__section">
              <h3 className="admin-order-details-drawer__section-title">Timeline</h3>
              <div className="admin-order-details-drawer__grid">
                <div className="admin-order-details-drawer__field">
                  <span className="admin-order-details-drawer__label">Created</span>
                  <strong className="admin-order-details-drawer__value">
                    {formatAdminOrderDate(order.date_created)}
                  </strong>
                </div>
                <div className="admin-order-details-drawer__field">
                  <span className="admin-order-details-drawer__label">Updated</span>
                  <strong className="admin-order-details-drawer__value">
                    {formatAdminOrderDate(order.date_updated)}
                  </strong>
                </div>
              </div>
            </section>

            {isAdmin && (
              <section className="admin-order-details-drawer__section">
                <h3 className="admin-order-details-drawer__section-title">Customer</h3>
                <div className="admin-order-details-drawer__grid">
                  <div className="admin-order-details-drawer__field">
                    <span className="admin-order-details-drawer__label">Name</span>
                    <strong className="admin-order-details-drawer__value">
                      {order.customer_name || 'Unknown customer'}
                    </strong>
                  </div>
                  <div className="admin-order-details-drawer__field">
                    <span className="admin-order-details-drawer__label">Email</span>
                    <strong className="admin-order-details-drawer__value">
                      {order.customer_email || 'No email'}
                    </strong>
                  </div>
                  <div className="admin-order-details-drawer__field">
                    <span className="admin-order-details-drawer__label">Payment</span>
                    <strong className="admin-order-details-drawer__value">
                      {order.payment_id ? `#${order.payment_id}` : 'None'}
                    </strong>
                  </div>
                </div>
              </section>
            )}

            <section className="admin-order-details-drawer__section">
              <h3 className="admin-order-details-drawer__section-title">Pickup point</h3>
              <div className="admin-order-details-drawer__field">
                <span className="admin-order-details-drawer__label">
                  {order.pickup_point_name || (order.pickup_point_id ? `Pickup #${order.pickup_point_id}` : 'Pickup')}
                </span>
                <strong className="admin-order-details-drawer__value">
                  {order.pickup_point_address || 'No pickup address'}
                </strong>
              </div>
            </section>

            <section className="admin-order-details-drawer__section">
              <h3 className="admin-order-details-drawer__section-title">Products</h3>
              <div className="admin-order-details-drawer__items">
                {(order.items || []).map((item) => (
                  <div
                    className="admin-order-details-drawer__item"
                    key={item.order_item_id || `${item.product_id}-${item.variant_id}`}
                  >
                    <div className="admin-order-details-drawer__item-image">
                      {item.image_url ? (
                        <img
                          className="admin-order-details-drawer__item-image-file"
                          src={item.image_url}
                          alt={item.product_name}
                        />
                      ) : (
                        <span className="admin-order-details-drawer__item-image-placeholder">
                          No image
                        </span>
                      )}
                    </div>
                    <div className="admin-order-details-drawer__item-main">
                      <strong className="admin-order-details-drawer__item-name">
                        {item.product_name}
                      </strong>
                      <span className="admin-order-details-drawer__item-variant">
                        {[item.color, item.size].filter(Boolean).join(' / ') || 'Standard variant'}
                      </span>
                    </div>
                    <div className="admin-order-details-drawer__item-meta">
                      <span className="admin-order-details-drawer__item-detail">
                        Qty {item.quantity}
                      </span>
                      <span className="admin-order-details-drawer__item-detail">
                        {formatCurrency(item.unit_price)} each
                      </span>
                      <strong className="admin-order-details-drawer__item-total">
                        {formatCurrency(item.total_price)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminFormDrawer>
  );
};

export default AdminOrderDetailsDrawer;
