import type { EUserRole } from '../../../shared/store/user/user.types';

export enum EAdminOrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface IAdminOrderItem {
  order_item_id?: number;
  product_id: number;
  variant_id: number;
  image_url?: string | null;
  product_name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
}

export interface IAdminOrder {
  order_id: number;
  cart_id?: number;
  payment_id?: number | null;
  pickup_point_id?: number | null;
  pickup_point_name?: string | null;
  pickup_point_address?: string | null;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  total_price?: string | number;
  supplier_total_price?: string | number;
  order_status: EAdminOrderStatus;
  item_count: number;
  date_created: string;
  date_updated: string;
  is_review?: boolean;
  items?: IAdminOrderItem[];
}

export interface IAdminOrdersListRequestParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: EAdminOrderStatus;
}

export interface IAdminOrderDetailRequestParams {
  order_id: IAdminOrder['order_id'];
}

export interface IUpdateAdminOrderStatusRequestParams extends IAdminOrderDetailRequestParams {
  payload: {
    order_status: EAdminOrderStatus;
  };
}

export interface IAdminOrdersColumnRenderProps {
  currentRole?: EUserRole;
  isStatusUpdating: boolean;
  onStatusChange: (order: IAdminOrder, nextStatus: EAdminOrderStatus) => void;
  onViewDetails: (order: IAdminOrder) => void;
}
