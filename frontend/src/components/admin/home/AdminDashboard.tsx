import React from 'react';
import { DollarCircleOutlined, TeamOutlined } from '@ant-design/icons';
import AdminHomeActivityPanel from './AdminHomeActivityPanel';
import AdminHomeInfoBox from './AdminHomeInfoBox';
import type { IAdminDashboardOverview } from './AdminHome.types';

interface AdminDashboardProps {
  overview?: IAdminDashboardOverview;
  isLoading: boolean;
  formatTrend: (trendPercent?: number) => string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ overview, isLoading, formatTrend }) => {
  const customerAmount = overview?.customer_amount ?? 0;
  const customerTrend = overview?.active_customer_trend_percent ?? 0;
  const revenueAmount = overview?.revenue_amount ?? 0;
  const revenueTrend = overview?.revenue_trend_percent ?? 0;
  const activities = [
    {
      label: `${formatTrend(customerTrend)} active customer signup trend`,
      time: 'Live',
    },
    {
      label: `${formatTrend(revenueTrend)} completed-order revenue trend`,
      time: 'Last 30 days',
    },
    {
      label: 'Supplier notifications are ready for review',
      time: 'Admin panel',
    },
  ];

  return (
    <>
      <div className="admin-home__metrics">
        <AdminHomeInfoBox
          amount={customerAmount}
          name="Users"
          caption="Active customer accounts"
          icon={<TeamOutlined />}
          trend={formatTrend(customerTrend)}
          isLoading={isLoading}
        />
        <AdminHomeInfoBox
          amount={revenueAmount}
          name="Revenue"
          caption="Completed orders last 30 days"
          icon={<DollarCircleOutlined />}
          trend={formatTrend(revenueTrend)}
          isLoading={isLoading}
          valuePrefix="$"
        />
      </div>

      <AdminHomeActivityPanel title="Today at a glance" activities={activities} />
    </>
  );
};

export default AdminDashboard;
