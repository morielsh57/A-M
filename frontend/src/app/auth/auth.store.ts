import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import {  createReducer } from '@reduxjs/toolkit';
import { apiService, createApiThunk } from '../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../shared/api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../../shared/store/utils';
import { IChangePasswordRequest, ILoginRequest, ILoginResponse, ISignUpRequest } from './auth.types';
import { API_ROUTES } from '../routing';
import { clearGuestCartId, getStoredGuestCartId } from '../../components/client/cart/cart.utils';

export interface AuthStoreState extends ApiDataStateType {
  signupRes: IAPIRequestState<void>;
  loginRes: IAPIRequestState<ILoginResponse>;
  adminLoginRes: IAPIRequestState<ILoginResponse>;
  changePasswordRes: IAPIRequestState<void>;
}

const initialState: AuthStoreState = {
  signupRes: APIRequestState.create<void>(),
  loginRes: APIRequestState.create<ILoginResponse>(),
  adminLoginRes: APIRequestState.create<ILoginResponse>(),
  changePasswordRes: APIRequestState.create<void>(),
};

export const loginRequest = createApiThunk<ILoginResponse, ILoginRequest>(
  'auth/login',
  (payload) => {
    const guestCartId = getStoredGuestCartId();

    return apiService.post<ILoginResponse>(API_ROUTES.AUTH.LOGIN, {
      ...payload,
      ...(guestCartId ? { guest_cart_id: guestCartId } : {}),
    });
  },
);

export const adminLoginRequest = createApiThunk<ILoginResponse, ILoginRequest>(
  'auth/adminLogin',
  (payload) => apiService.post<ILoginResponse>(API_ROUTES.AUTH.LOGIN, { ...payload, isAdmin: true }),
);

export const signupRequest = createApiThunk<void, ISignUpRequest>(
  'auth/signup',
  (payload) => apiService.post<void>(API_ROUTES.AUTH.SIGNUP, payload),
);

export const changePasswordRequest = createApiThunk<void, IChangePasswordRequest>(
  'auth/changePassword',
  (payload) => apiService.post<void, IChangePasswordRequest>(API_ROUTES.AUTH.PASSWORD_CHANGE, payload),
);

export const authStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(signupRequest, 'signupRes', apiBuilder, {
    onPending: (state) => {
      state.signupRes.error = undefined;
      state.signupRes.data = undefined;
    },
    onFulfilled: (state) => {
      state.signupRes.error = undefined;
    },
  });

  createAPIReducerCases(loginRequest, 'loginRes', apiBuilder, {
    onPending: (state) => {
      state.loginRes.error = undefined;
      state.loginRes.data = undefined;
    },
    onFulfilled: (state) => {
      state.loginRes.error = undefined;
      clearGuestCartId();
    },
  });

  createAPIReducerCases(adminLoginRequest, 'adminLoginRes', apiBuilder, {
    onPending: (state) => {
      state.adminLoginRes.error = undefined;
      state.adminLoginRes.data = undefined;
    },
    onFulfilled: (state) => {
      state.adminLoginRes.error = undefined;
    },
  });

  createAPIReducerCases(changePasswordRequest, 'changePasswordRes', apiBuilder, {
    onPending: (state) => {
      state.changePasswordRes.error = undefined;
      state.changePasswordRes.data = undefined;
    },
    onFulfilled: (state) => {
      state.changePasswordRes.error = undefined;
    },
  });
});
