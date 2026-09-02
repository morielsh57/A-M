import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { EAPIStatus, type IAPIRequestState, type IMeta } from '../../../shared/api/models';
import { createAPIMapReducerCases, type ApiDataStateType } from '../../../shared/store/utils';

export enum EOrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface IOrderItem {
  order_item_id?: number;
  variant_id: number;
  product_id: number;
  image_url?: string | null;
  review?: {
    review_id: number;
    stars: number;
    review_text: string;
    date_created?: string;
  } | null;
  product_name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
}

export interface IOrder {
  order_id: number;
  payment_id: number;
  pickup_point_id: number;
  pickup_point_name?: string | null;
  pickup_point_address?: string | null;
  total_price: string | number;
  order_status: EOrderStatus;
  date_created: string;
  date_updated: string;
  items: IOrderItem[];
}

export interface IOrderListItem {
  order_id: number;
  payment_id: number;
  pickup_point_id: number;
  total_price: string | number;
  order_status: EOrderStatus;
  item_count: number;
  date_created: string;
  date_updated: string;
}

export interface IMyOrdersRequest {
  page?: number;
  page_size?: number;
}

export interface OrdersStoreState extends ApiDataStateType {
  myOrdersByQueryReq: Record<string, IAPIRequestState<IOrderListItem[]>>;
  orderByIdReq: Record<string, IAPIRequestState<IOrder>>;
}

const initialState: OrdersStoreState = {
  myOrdersByQueryReq: {},
  orderByIdReq: {},
};

export const MY_ORDERS_PAGE_SIZE = 8;

export const getMyOrdersCacheKey = (params: IMyOrdersRequest) => [
  `page:${params.page || 1}`,
  `page_size:${params.page_size || MY_ORDERS_PAGE_SIZE}`,
].join('|');

export const getOrderByIdCacheKey = (orderId: string | number) => String(orderId);

export const setOrderById = createAction<IOrder>('orders/setOrderById');
export const clearMyOrdersCache = createAction('orders/clearMyOrdersCache');

export const getMyOrders = createApiThunk<IOrderListItem[], IMyOrdersRequest>(
  'orders/getMyOrders',
  (params) => apiService.get<IOrderListItem[], IMeta>(
    API_ROUTES.ORDERS,
    {
      params: {
        page: params.page || 1,
        page_size: params.page_size || MY_ORDERS_PAGE_SIZE,
      },
    },
  ),
);

export const getOrderById = createApiThunk<IOrder, string | number>(
  'orders/getOrderById',
  (orderId) => apiService.get<IOrder>(API_ROUTES.ORDER_DETAIL(orderId)),
);

export const ordersStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getMyOrders,
    'myOrdersByQueryReq',
    getMyOrdersCacheKey,
    apiBuilder,
  );
  createAPIMapReducerCases(
    getOrderById,
    'orderByIdReq',
    getOrderByIdCacheKey,
    apiBuilder,
  );

  builder
    .addCase(setOrderById, (state, action) => {
      state.orderByIdReq[getOrderByIdCacheKey(action.payload.order_id)] = {
        status: EAPIStatus.FULFILLED,
        data: action.payload,
      };
    })
    .addCase(clearMyOrdersCache, (state) => {
      state.myOrdersByQueryReq = {};
    });
});
