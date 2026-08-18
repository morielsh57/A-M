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
  IAdminUser,
  IAdminUserCreateRequest,
  IAdminUserDetailRequestParams,
  IAdminUsersListRequestParams,
  IUpdateAdminUserRequestParams,
} from './adminUsers.types';

interface AdminUsersStoreState extends ApiDataStateType {
  usersByQueryReq: Record<string, IAPIRequestState<IAdminUser[]>>;
  userByIdReq: Record<string, IAPIRequestState<IAdminUser>>;
  updateUserReq: IAPIRequestState<IAdminUser>;
  createUserReq: IAPIRequestState<IAdminUser>;
  deleteUserReq: IAPIRequestState<void>;
}

const initialState: AdminUsersStoreState = {
  usersByQueryReq: {},
  userByIdReq: {},
  updateUserReq: APIRequestState.create<IAdminUser>(),
  createUserReq: APIRequestState.create<IAdminUser>(),
  deleteUserReq: APIRequestState.create<void>(),
};

export const getAdminUsersCacheKey = (params: IAdminUsersListRequestParams) => [
  `role:${params.role || ''}`,
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
  `search:${params.search || ''}`,
  `active:${params.is_active ?? ''}`,
].join('|');

export const getAdminUsers = createApiThunk<IAdminUser[], IAdminUsersListRequestParams>(
  'adminUsers/getUsers',
  (params) => apiService.get<IAdminUser[], IMeta>(API_ROUTES.ADMIN.USERS, { params }),
);

export const getAdminUser = createApiThunk<IAdminUser, IAdminUserDetailRequestParams>(
  'adminUsers/getUser',
  ({ user_id }) => apiService.get<IAdminUser>(API_ROUTES.ADMIN.USER_DETAIL(user_id)),
);

export const createAdminUser = createApiThunk<IAdminUser, IAdminUserCreateRequest>(
  'adminUsers/createUser',
  (payload) => apiService.post<IAdminUser, IAdminUserCreateRequest>(
    API_ROUTES.ADMIN.USERS,
    payload,
  ),
);

export const updateAdminUser = createApiThunk<IAdminUser, IUpdateAdminUserRequestParams>(
  'adminUsers/updateUser',
  ({ payload, user_id }) => apiService.patch<IAdminUser>(
    API_ROUTES.ADMIN.USER_DETAIL(user_id),
    payload,
  ),
);

export const deleteAdminUser = createApiThunk<void, IAdminUserDetailRequestParams>(
  'adminUsers/deleteUser',
  ({ user_id }) => apiService.delete<void>(API_ROUTES.ADMIN.USER_DETAIL(user_id)),
);

export const adminUsersStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getAdminUsers,
    'usersByQueryReq',
    getAdminUsersCacheKey,
    apiBuilder,
  );
  createAPIMapReducerCases(
    getAdminUser,
    'userByIdReq',
    ({ user_id }) => String(user_id),
    apiBuilder,
  );
  createAPIReducerCases(updateAdminUser, 'updateUserReq', apiBuilder);
  createAPIReducerCases(createAdminUser, 'createUserReq', apiBuilder);
  createAPIReducerCases(deleteAdminUser, 'deleteUserReq', apiBuilder);
});
