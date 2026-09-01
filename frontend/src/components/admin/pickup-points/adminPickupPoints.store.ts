import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { APIRequestState, type IAPIRequestState, type IMeta } from '../../../shared/api/models';
import {
  createAPIMapReducerCases,
  createAPIReducerCases,
  type ApiDataStateType,
} from '../../../shared/store/utils';
import type {
  IAdminPickupPoint,
  IAdminPickupPointDetailRequestParams,
  IAdminPickupPointsListRequestParams,
  IAdminPickupPointWriteRequest,
  IUpdateAdminPickupPointRequestParams,
} from './adminPickupPoints.types';

export interface AdminPickupPointsStoreState extends ApiDataStateType {
  pickupPointsByQueryReq: Record<string, IAPIRequestState<IAdminPickupPoint[]>>;
  pickupPointByIdReq: Record<string, IAPIRequestState<IAdminPickupPoint>>;
  createPickupPointReq: IAPIRequestState<IAdminPickupPoint>;
  updatePickupPointReq: IAPIRequestState<IAdminPickupPoint>;
  deletePickupPointReq: IAPIRequestState<void>;
}

const initialState: AdminPickupPointsStoreState = {
  pickupPointsByQueryReq: {},
  pickupPointByIdReq: {},
  createPickupPointReq: APIRequestState.create<IAdminPickupPoint>(),
  updatePickupPointReq: APIRequestState.create<IAdminPickupPoint>(),
  deletePickupPointReq: APIRequestState.create<void>(),
};

export const getAdminPickupPointsCacheKey = (
  params: IAdminPickupPointsListRequestParams,
) => [
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
  `search:${params.search || ''}`,
].join('|');

export const getAdminPickupPointCacheKey = (
  params: IAdminPickupPointDetailRequestParams,
) => String(params.pick_up_point_id);

export const getAdminPickupPoints = createApiThunk<
  IAdminPickupPoint[],
  IAdminPickupPointsListRequestParams
>(
  'adminPickupPoints/getPickupPoints',
  (params) => apiService.get<IAdminPickupPoint[], IMeta>(
    API_ROUTES.ADMIN.PICKUP_POINTS,
    { params },
  ),
);

export const getAdminPickupPoint = createApiThunk<
  IAdminPickupPoint,
  IAdminPickupPointDetailRequestParams
>(
  'adminPickupPoints/getPickupPoint',
  ({ pick_up_point_id }) => apiService.get<IAdminPickupPoint>(
    API_ROUTES.ADMIN.PICKUP_POINT_DETAIL(pick_up_point_id),
  ),
);

export const createAdminPickupPoint = createApiThunk<
  IAdminPickupPoint,
  IAdminPickupPointWriteRequest
>(
  'adminPickupPoints/createPickupPoint',
  (payload) => apiService.post<IAdminPickupPoint, IAdminPickupPointWriteRequest>(
    API_ROUTES.ADMIN.PICKUP_POINTS,
    payload,
  ),
);

export const updateAdminPickupPoint = createApiThunk<
  IAdminPickupPoint,
  IUpdateAdminPickupPointRequestParams
>(
  'adminPickupPoints/updatePickupPoint',
  ({ pick_up_point_id, payload }) => apiService.patch<IAdminPickupPoint>(
    API_ROUTES.ADMIN.PICKUP_POINT_DETAIL(pick_up_point_id),
    payload,
  ),
);

export const deleteAdminPickupPoint = createApiThunk<
  void,
  IAdminPickupPointDetailRequestParams
>(
  'adminPickupPoints/deletePickupPoint',
  ({ pick_up_point_id }) => apiService.delete<void>(
    API_ROUTES.ADMIN.PICKUP_POINT_DETAIL(pick_up_point_id),
  ),
);

export const adminPickupPointsStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getAdminPickupPoints,
    'pickupPointsByQueryReq',
    getAdminPickupPointsCacheKey,
    apiBuilder,
  );
  createAPIMapReducerCases(
    getAdminPickupPoint,
    'pickupPointByIdReq',
    getAdminPickupPointCacheKey,
    apiBuilder,
  );
  createAPIReducerCases(createAdminPickupPoint, 'createPickupPointReq', apiBuilder);
  createAPIReducerCases(updateAdminPickupPoint, 'updatePickupPointReq', apiBuilder);
  createAPIReducerCases(deleteAdminPickupPoint, 'deletePickupPointReq', apiBuilder);
});
