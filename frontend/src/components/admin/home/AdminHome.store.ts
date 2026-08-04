import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../../shared/api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../../../shared/store/utils';
import type { IAdminDashboardOverview } from './AdminHome.types';

export interface AdminHomeStoreState extends ApiDataStateType {
  dashboardOverviewRequest: IAPIRequestState<IAdminDashboardOverview>;
}

const initialState: AdminHomeStoreState = {
  dashboardOverviewRequest: APIRequestState.create<IAdminDashboardOverview>(),
};

export const getAdminDashboardOverview = createApiThunk<IAdminDashboardOverview>(
  'adminHome/dashboardOverview',
  () => apiService.get<IAdminDashboardOverview>(API_ROUTES.ADMIN.DASHBOARD_OVERVIEW),
);

export const adminHomeStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getAdminDashboardOverview, 'dashboardOverviewRequest', apiBuilder);
});
