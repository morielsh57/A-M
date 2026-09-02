import React from 'react';
import { Alert } from 'antd';
import { formatCurrency } from '../../../../shared/components/app-table/appTable.utils';
import AppButton from '../../../../shared/components/app-button/AppButton';
import { EAPIStatus, type IAPIError } from '../../../../shared/api/models';
import type { IAdminOrder } from '../../orders/adminOrders.types';
import {
  formatAdminOrderDate,
  getAdminOrderErrorMessage,
  getAdminOrderTotal,
} from '../../orders/adminOrders.utils';
import './SupplierNotificationOrderDetails.scss';

interface SupplierNotificationOrderDetailsProps {
  error?: IAPIError;
  loadingStatus?: EAPIStatus;
  order?: IAdminOrder;
  onRetry: () => void;
}

const SupplierNotificationOrderDetails: React.FC<SupplierNotificationOrderDetailsProps> = ({
  error,
  loadingStatus,
  order,
  onRetry,
}) => {
  const isLoading = loadingStatus === EAPIStatus.PENDING || (!order && !error);

  if (isLoading) {
    return (
      <div className="supplier-notification-order-details__state">
        <strong>Loading order details...</strong>
        <span>Preparing the supplier order products for this notification.</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        className="supplier-notification-order-details__error"
        type="error"
        showIcon
        message="Order could not be loaded"
        description={getAdminOrderErrorMessage(error, 'The order request failed. Please try again.')}
        action={<AppButton variant="secondary" onClick={onRetry}>Try again</AppButton>}
      />
    );
  }

  if (!order) {
    return (
      <div className="supplier-notification-order-details__state">
        <strong>Order was not found.</strong>
      </div>
    );
  }

  return (
    <section className="supplier-notification-order-details">
      <div className="supplier-notification-order-details__section">
        <h2 className="supplier-notification-order-details__section-title">Order summary</h2>
        <div className="supplier-notification-order-details__summary">
          <div className="supplier-notification-order-details__field">
            <span className="supplier-notification-order-details__label">Order</span>
            <strong className="supplier-notification-order-details__value">
              #{order.order_id}
            </strong>
          </div>
          <div className="supplier-notification-order-details__field">
            <span className="supplier-notification-order-details__label">Products</span>
            <strong className="supplier-notification-order-details__value">
              {order.item_count}
            </strong>
          </div>
          <div className="supplier-notification-order-details__field">
            <span className="supplier-notification-order-details__label">Supplier total</span>
            <strong className="supplier-notification-order-details__value">
              {formatCurrency(getAdminOrderTotal(order))}
            </strong>
          </div>
        </div>
      </div>

      <div className="supplier-notification-order-details__section">
        <h2 className="supplier-notification-order-details__section-title">Timeline</h2>
        <div className="supplier-notification-order-details__grid">
          <div className="supplier-notification-order-details__field">
            <span className="supplier-notification-order-details__label">Created</span>
            <strong className="supplier-notification-order-details__value">
              {formatAdminOrderDate(order.date_created)}
            </strong>
          </div>
          <div className="supplier-notification-order-details__field">
            <span className="supplier-notification-order-details__label">Updated</span>
            <strong className="supplier-notification-order-details__value">
              {formatAdminOrderDate(order.date_updated)}
            </strong>
          </div>
        </div>
      </div>

      <div className="supplier-notification-order-details__section">
        <h2 className="supplier-notification-order-details__section-title">Pickup point</h2>
        <div className="supplier-notification-order-details__field">
          <span className="supplier-notification-order-details__label">
            {order.pickup_point_name || (order.pickup_point_id ? `Pickup #${order.pickup_point_id}` : 'Pickup')}
          </span>
          <strong className="supplier-notification-order-details__value">
            {order.pickup_point_address || 'No pickup address'}
          </strong>
        </div>
      </div>

      <div className="supplier-notification-order-details__section">
        <h2 className="supplier-notification-order-details__section-title">Products</h2>
        <div className="supplier-notification-order-details__items">
          {(order.items || []).map((item) => (
            <div
              className="supplier-notification-order-details__item"
              key={item.order_item_id || `${item.product_id}-${item.variant_id}`}
            >
              <div className="supplier-notification-order-details__item-image">
                {item.image_url ? (
                  <img
                    className="supplier-notification-order-details__item-image-file"
                    src={item.image_url}
                    alt={item.product_name}
                  />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <div className="supplier-notification-order-details__item-main">
                <strong className="supplier-notification-order-details__item-name">
                  {item.product_name}
                </strong>
                <span className="supplier-notification-order-details__item-variant">
                  {[item.color, item.size].filter(Boolean).join(' / ') || 'Standard variant'}
                </span>
              </div>
              <div className="supplier-notification-order-details__item-meta">
                <span className="supplier-notification-order-details__item-detail">
                  Qty {item.quantity}
                </span>
                <span className="supplier-notification-order-details__item-detail">
                  {formatCurrency(item.unit_price)} each
                </span>
                <strong className="supplier-notification-order-details__item-total">
                  {formatCurrency(item.total_price)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupplierNotificationOrderDetails;
