import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { getItemFromLocalStorage, removeItemFromLocalStorage, setItemInLocalStorage } from '../../utils/localStorage.utils';
import { ApiDataStateType, createAPIReducerCases } from '../utils';
import { IAdminOrSupplierUser, IUser } from './user.types';
import { APIRequestState, IAPIRequestState } from '../../api/models';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import { apiService, createApiThunk } from '../../api/axios';
import { API_ROUTES } from '../../../app/routing';

export interface UserStoreState extends ApiDataStateType {
  getCurrentUserRequest: IAPIRequestState<IUser>;
  getCurrentAdminOrSupplierRequest: IAPIRequestState<IAdminOrSupplierUser>;
  user?: IUser;
  adminOrSupplierUser?: IAdminOrSupplierUser;
}

const initialState: UserStoreState = {
  getCurrentUserRequest: APIRequestState.create<IUser>(),
  getCurrentAdminOrSupplierRequest: APIRequestState.create<IAdminOrSupplierUser>(),
  user: getItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER) || undefined,
  adminOrSupplierUser: getItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER) || undefined,
};

export const getCurrentUser = createApiThunk(
  'user/currentUser',
  () => apiService.get<IUser>(API_ROUTES.USERS_ME),
);

export const getCurrentAdminOrSupplier = createApiThunk(
  'user/currentAdminOrSupplier',
  () => apiService.get<IAdminOrSupplierUser>(API_ROUTES.USERS_ME),
);

export const clearCurrentUser = createAction('user/clearCurrentUser');
export const clearCurrentAdminOrSupplierUser = createAction('user/clearCurrentAdminOrSupplierUser');

export const userStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getCurrentUser, 'getCurrentUserRequest', apiBuilder, {
    onFulfilled: (state, payload) => {
      const user = payload ?? {};
      state.user = user;
      setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER, user);
    },
  });

  createAPIReducerCases(getCurrentAdminOrSupplier, 'getCurrentAdminOrSupplierRequest', apiBuilder, {
    onFulfilled: (state, payload) => {
      const user = payload ?? {};
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
