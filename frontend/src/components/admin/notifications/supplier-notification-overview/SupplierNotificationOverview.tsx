import React from 'react';
import { Tag } from 'antd';
import { getAdminOrderStatusColor } from '../../orders/adminOrders.utils';
import type { IAdminOrder } from '../../orders/adminOrders.types';
import type { ISupplierNotification } from '../supplierNotifications.types';
import {
  formatSupplierNotificationDate,
  getSupplierNotificationTitle,
} from '../supplierNotifications.utils';
import './SupplierNotificationOverview.scss';

interface SupplierNotificationOverviewProps {
  notification: ISupplierNotification;
  order?: IAdminOrder;
}

const SupplierNotificationOverview: React.FC<SupplierNotificationOverviewProps> = ({
  notification,
  order,
}) => (
  <section className="supplier-notification-overview">
    <div className="supplier-notification-overview__item">
      <span className="supplier-notification-overview__label">Notification</span>
      <strong className="supplier-notification-overview__value">
        {getSupplierNotificationTitle(notification)}
      </strong>
    </div>
    <div className="supplier-notification-overview__item">
      <span className="supplier-notification-overview__label">Received</span>
      <strong className="supplier-notification-overview__value">
        {formatSupplierNotificationDate(notification.date_created)}
      </strong>
    </div>
    <div className="supplier-notification-overview__item">
      <span className="supplier-notification-overview__label">Order status</span>
      <span>
        <Tag color={getAdminOrderStatusColor(order?.order_status || notification.order_status as IAdminOrder['order_status'])}>
          {order?.order_status || notification.order_status}
        </Tag>
      </span>
    </div>
  </section>
);

export default SupplierNotificationOverview;
