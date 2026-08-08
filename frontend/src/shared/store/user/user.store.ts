import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { getItemFromLocalStorage, removeItemFromLocalStorage, setItemInLocalStorage } from '../../utils/localStorage.utils';
import { ApiDataStateType, createAPIReducerCases } from '../utils';
import { IAdminOrSupplierUser, IUpdateUserProfileRequest, IUser } from './user.types';
import { APIRequestState, IAPIRequestState } from '../../api/models';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import { apiService, createApiThunk } from '../../api/axios';
import { API_ROUTES } from '../../../app/routing';

export interface UserStoreState extends ApiDataStateType {
  getCurrentUserRequest: IAPIRequestState<IUser>;
  getCurrentAdminOrSupplierRequest: IAPIRequestState<IAdminOrSupplierUser>;
  updateCurrentUserProfileRequest: IAPIRequestState<IUser>;
  user?: IUser;
  adminOrSupplierUser?: IAdminOrSupplierUser;
}

const initialState: UserStoreState = {
  getCurrentUserRequest: APIRequestState.create<IUser>(),
  getCurrentAdminOrSupplierRequest: APIRequestState.create<IAdminOrSupplierUser>(),
  updateCurrentUserProfileRequest: APIRequestState.create<IUser>(),
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

export const updateCurrentUserProfile = createApiThunk<IUser, IUpdateUserProfileRequest>(
  'user/updateCurrentUserProfile',
  (payload) => apiService.patch<IUser, IUpdateUserProfileRequest>(API_ROUTES.USERS_ME, payload),
);

export const clearCurrentUser = createAction('user/clearCurrentUser');
export const clearCurrentAdminOrSupplierUser = createAction('user/clearCurrentAdminOrSupplierUser');

const syncCurrentUser = (state: UserStoreState, user: IUser) => {
  if (state.user?.user_id === user.user_id) {
    state.user = user;
    setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER, user);
  }

  if (state.adminOrSupplierUser?.user_id === user.user_id) {
    state.adminOrSupplierUser = user as IAdminOrSupplierUser;
    setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER, user);
  }
};

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

  createAPIReducerCases(updateCurrentUserProfile, 'updateCurrentUserProfileRequest', apiBuilder, {
    onPending: (state) => {
      state.updateCurrentUserProfileRequest.error = undefined;
      state.updateCurrentUserProfileRequest.data = undefined;
    },
    onFulfilled: (state, payload) => {
      syncCurrentUser(state as UserStoreState, payload);
      state.updateCurrentUserProfileRequest.error = undefined;
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
