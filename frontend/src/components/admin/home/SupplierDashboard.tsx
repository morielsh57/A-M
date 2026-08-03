import React from 'react';
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import AdminHomeActivityPanel from './AdminHomeActivityPanel';
import AdminHomeInfoBox from './AdminHomeInfoBox';
import type { IAdminDashboardOverview } from './AdminHome.types';

interface SupplierDashboardProps {
  overview?: IAdminDashboardOverview;
  isLoading: boolean;
  formatTrend: (trendPercent?: number) => string;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({
  overview,
  isLoading,
  formatTrend,
}) => {
  const productAmount = overview?.supplier_product_amount ?? 0;
  const lowStockAmount = overview?.supplier_low_stock_product_amount ?? 0;
  const orderAmount = overview?.supplier_order_amount ?? 0;
  const orderTrend = overview?.supplier_order_trend_percent ?? 0;
  const revenueAmount = overview?.revenue_amount ?? 0;
  const revenueTrend = overview?.revenue_trend_percent ?? 0;
  const activities = [
    {
      label: `${formatTrend(revenueTrend)} revenue trend for your products`,
      time: 'Last 30 days',
    },
    {
      label: `${formatTrend(orderTrend)} completed-order trend for your products`,
      time: 'Last 30 days',
    },
    {
      label: `${lowStockAmount} products need stock attention`,
      time: 'Inventory',
    },
  ];

  return (
    <>
      <div className="admin-home__metrics admin-home__metrics--supplier">
        <AdminHomeInfoBox
          amount={revenueAmount}
          name="Revenue"
          caption="Your products in completed orders"
          icon={<DollarCircleOutlined />}
          trend={formatTrend(revenueTrend)}
          isLoading={isLoading}
          valuePrefix="$"
        />
        <AdminHomeInfoBox
          amount={orderAmount}
          name="Orders"
          caption="Completed orders with your products"
          icon={<ShoppingCartOutlined />}
          trend={formatTrend(orderTrend)}
          isLoading={isLoading}
        />
        <AdminHomeInfoBox
          amount={productAmount}
          name="Products"
          caption="Products assigned to your supplier account"
          icon={<ShopOutlined />}
          trend="Catalog"
          isLoading={isLoading}
        />
        <AdminHomeInfoBox
          amount={lowStockAmount}
          name="Low stock"
          caption="Products with 5 units or fewer"
          icon={<WarningOutlined />}
          trend="Review"
          isLoading={isLoading}
        />
      </div>

      <AdminHomeActivityPanel title="Supplier snapshot" activities={activities} />
    </>
  );
};

export default SupplierDashboard;
