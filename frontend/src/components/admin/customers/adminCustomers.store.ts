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
  IAdminCustomer,
  IAdminCustomerCreateRequest,
  IAdminCustomerDetailRequestParams,
  IAdminCustomersListRequestParams,
  IUpdateAdminCustomerRequestParams,
} from './adminCustomers.types';

interface AdminCustomersStoreState extends ApiDataStateType {
  customersByQueryReq: Record<string, IAPIRequestState<IAdminCustomer[]>>;
  customerByIdReq: Record<string, IAPIRequestState<IAdminCustomer>>;
  updateCustomerReq: IAPIRequestState<IAdminCustomer>;
  createCustomerReq: IAPIRequestState<IAdminCustomer>;
  deleteCustomerReq: IAPIRequestState<void>;
}

const initialState: AdminCustomersStoreState = {
  customersByQueryReq: {},
  customerByIdReq: {},
  updateCustomerReq: APIRequestState.create<IAdminCustomer>(),
  createCustomerReq: APIRequestState.create<IAdminCustomer>(),
  deleteCustomerReq: APIRequestState.create<void>(),
};

export const getAdminCustomersCacheKey = (params: IAdminCustomersListRequestParams) => [
  `role:${params.role}`,
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
  `search:${params.search || ''}`,
  `active:${params.is_active ?? ''}`,
].join('|');

export const getAdminCustomers = createApiThunk<IAdminCustomer[], IAdminCustomersListRequestParams>(
  'adminCustomers/getCustomers',
  (params) => apiService.get<IAdminCustomer[], IMeta>(API_ROUTES.ADMIN.USERS, { params }),
);

export const getAdminCustomer = createApiThunk<IAdminCustomer, IAdminCustomerDetailRequestParams>(
  'adminCustomers/getCustomer',
  ({ user_id }) => apiService.get<IAdminCustomer>(API_ROUTES.ADMIN.USER_DETAIL(user_id)),
);

export const createAdminCustomer = createApiThunk<IAdminCustomer, IAdminCustomerCreateRequest>(
  'adminCustomers/createCustomer',
  (payload) => apiService.post<IAdminCustomer, IAdminCustomerCreateRequest>(
    API_ROUTES.ADMIN.USERS,
    payload,
  ),
);

export const updateAdminCustomer = createApiThunk<IAdminCustomer, IUpdateAdminCustomerRequestParams>(
  'adminCustomers/updateCustomer',
  ({ payload, user_id }) => apiService.patch<IAdminCustomer>(
    API_ROUTES.ADMIN.USER_DETAIL(user_id),
    payload,
  ),
);

export const deleteAdminCustomer = createApiThunk<void, IAdminCustomerDetailRequestParams>(
  'adminCustomers/deleteCustomer',
  ({ user_id }) => apiService.delete<void>(API_ROUTES.ADMIN.USER_DETAIL(user_id)),
);

export const adminCustomersStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getAdminCustomers,
    'customersByQueryReq',
    getAdminCustomersCacheKey,
    apiBuilder,
  );
  createAPIMapReducerCases(
    getAdminCustomer,
    'customerByIdReq',
    ({ user_id }) => String(user_id),
    apiBuilder,
  );
  createAPIReducerCases(updateAdminCustomer, 'updateCustomerReq', apiBuilder);
  createAPIReducerCases(createAdminCustomer, 'createCustomerReq', apiBuilder);
  createAPIReducerCases(deleteAdminCustomer, 'deleteCustomerReq', apiBuilder);
});
