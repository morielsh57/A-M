import React from 'react';
import { EAdminOrderStatus } from '../adminOrders.types';
import './AdminOrderStatusPill.scss';

interface AdminOrderStatusPillProps {
  status: EAdminOrderStatus;
}

const getStatusClassName = (status: EAdminOrderStatus) => {
  switch (status) {
    case EAdminOrderStatus.COMPLETED:
      return 'admin-order-status-pill--completed';
    case EAdminOrderStatus.CANCELLED:
      return 'admin-order-status-pill--cancelled';
    case EAdminOrderStatus.PENDING:
    default:
      return 'admin-order-status-pill--pending';
  }
};

const AdminOrderStatusPill: React.FC<AdminOrderStatusPillProps> = ({ status }) => (
  <span className={`admin-order-status-pill ${getStatusClassName(status)}`}>
    {status}
  </span>
);

export default AdminOrderStatusPill;
