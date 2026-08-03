export interface IAdminDashboardOverview {
  dashboard_type: string;
  customer_amount: number;
  active_customer_trend_percent: number;
  current_period_active_customers: number;
  previous_period_active_customers: number;
  supplier_product_amount?: number;
  supplier_low_stock_product_amount?: number;
  supplier_order_amount?: number;
  supplier_order_trend_percent?: number;
  revenue_amount: number;
  revenue_trend_percent: number;
  current_period_revenue: number;
  previous_period_revenue: number;
}
