import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import {
  APIRequestState,
  EAPIStatus,
  type IAPIRequestState,
  type IMeta,
} from '../../../shared/api/models';
import {
  createAPIMapReducerCases,
  createAPIReducerCases,
  type ApiDataStateType,
} from '../../../shared/store/utils';
import type {
  IAdminOrder,
  IAdminOrderDetailRequestParams,
  IAdminOrdersListRequestParams,
  IUpdateAdminOrderStatusRequestParams,
} from './adminOrders.types';

export interface AdminOrdersStoreState extends ApiDataStateType {
  adminOrdersByQueryReq: Record<string, IAPIRequestState<IAdminOrder[]>>;
  adminOrderByIdReq: Record<string, IAPIRequestState<IAdminOrder>>;
  updateAdminOrderStatusReq: IAPIRequestState<IAdminOrder>;
}

const initialState: AdminOrdersStoreState = {
  adminOrdersByQueryReq: {},
  adminOrderByIdReq: {},
  updateAdminOrderStatusReq: APIRequestState.create<IAdminOrder>(),
};

export const getAdminOrdersCacheKey = (params: IAdminOrdersListRequestParams) => [
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
  `search:${params.search || ''}`,
  `status:${params.status || ''}`,
].join('|');

export const getAdminOrderDetailCacheKey = (
  params: IAdminOrderDetailRequestParams,
) => String(params.order_id);

const cacheAdminOrderDetail = (
  state: ApiDataStateType,
  order: IAdminOrder,
) => {
  state.adminOrderByIdReq[String(order.order_id)] = {
    status: EAPIStatus.FULFILLED,
    data: order,
  };
};

export const getAdminOrders = createApiThunk<IAdminOrder[], IAdminOrdersListRequestParams>(
  'adminOrders/getAdminOrders',
  (params) => apiService.get<IAdminOrder[], IMeta>(
    API_ROUTES.ADMIN.ORDERS,
    { params },
  ),
);

export const getAdminOrderById = createApiThunk<IAdminOrder, IAdminOrderDetailRequestParams>(
  'adminOrders/getAdminOrderById',
  ({ order_id }) => apiService.get<IAdminOrder>(
    API_ROUTES.ADMIN.ORDER_DETAIL(order_id),
  ),
);

export const updateAdminOrderStatus = createApiThunk<IAdminOrder, IUpdateAdminOrderStatusRequestParams>(
  'adminOrders/updateAdminOrderStatus',
  ({ order_id, payload }) => apiService.patch<IAdminOrder>(
    API_ROUTES.ADMIN.ORDER_DETAIL(order_id),
    payload,
  ),
);

export const adminOrdersStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getAdminOrders,
    'adminOrdersByQueryReq',
    getAdminOrdersCacheKey,
    apiBuilder,
  );
  createAPIMapReducerCases(
    getAdminOrderById,
    'adminOrderByIdReq',
    getAdminOrderDetailCacheKey,
    apiBuilder,
  );
  createAPIReducerCases(updateAdminOrderStatus, 'updateAdminOrderStatusReq', apiBuilder, {
    onFulfilled: cacheAdminOrderDetail,
  });
});
