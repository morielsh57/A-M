import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../app/constants';
import { apiService, createApiThunk } from '../api/axios';
import { APIRequestState, type IAPIRequestState } from '../api/models';
import { createAPIReducerCases, type ApiDataStateType } from './utils';
import {
  IAdminOrSupplierUser,
  IGetAdminOrSupplierByIdResponse,
  IGetUserByIdResponse,
  IUser,
} from './user.types';
import { getItemFromLocalStorage, removeItemFromLocalStorage, setItemInLocalStorage } from '../utils/localStorage.utils';
import { API_ROUTES } from '../../app/routing';

export interface UserStoreState extends ApiDataStateType {
  getUserByIdRequest: IAPIRequestState<IGetUserByIdResponse>;
  getAdminOrSupplierByIdRequest: IAPIRequestState<IGetAdminOrSupplierByIdResponse>;
  user?: IUser;
  adminOrSupplierUser?: IAdminOrSupplierUser;
}

const initialState: UserStoreState = {
  getUserByIdRequest: APIRequestState.create<IGetUserByIdResponse>(),
  getAdminOrSupplierByIdRequest: APIRequestState.create<IGetAdminOrSupplierByIdResponse>(),
  user: getItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER) || undefined,
  adminOrSupplierUser: getItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER) || undefined,
};

export const getUserById = createApiThunk(
  'user/userById',
  (params?: {id?: number}) => apiService.get<IGetUserByIdResponse>(`${API_ROUTES.USERS}/${params?.id}`),
);

export const getAdminOrSupplierById = createApiThunk(
  'user/adminOrSupplierById',
  (params?: {id?: number}) => apiService.get<IGetAdminOrSupplierByIdResponse>(`${API_ROUTES.USERS}/${params?.id}`),
);

export const clearCurrentUser = createAction('user/clearCurrentUser');
export const clearCurrentAdminOrSupplierUser = createAction('user/clearCurrentAdminOrSupplierUser');

export const userStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getUserById, 'getUserByIdRequest', apiBuilder, {
    onFulfilled: (state, payload) => {
      const user = payload.data ?? {};
      state.user = user;
      setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER, user);
    },
  });

  createAPIReducerCases(getAdminOrSupplierById, 'getAdminOrSupplierByIdRequest', apiBuilder, {
    onFulfilled: (state, payload) => {
      const user = payload.data ?? {};
      state.adminOrSupplierUser = user;
      setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER, user);
    },
  });

  builder.addCase(clearCurrentUser, (state) => {
    state.user = undefined;
    removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER);
  });

  builder.addCase(clearCurrentAdminOrSupplierUser, (state) => {
    state.adminOrSupplierUser = undefined;
    removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER);
  });
});
