import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import {  createReducer } from '@reduxjs/toolkit';
import { apiService, createApiThunk } from '../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../shared/api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../../shared/store/utils';
import { ILoginRequest, ILoginResponse, ISignUpRequest } from './auth.types';
import { API_ROUTES } from '../routing';

export interface AuthStoreState extends ApiDataStateType {
  signupRes: IAPIRequestState<void>;
  loginRes: IAPIRequestState<ILoginResponse>;
  adminLoginRes: IAPIRequestState<ILoginResponse>;
}

const initialState: AuthStoreState = {
  signupRes: APIRequestState.create<void>(),
  loginRes: APIRequestState.create<ILoginResponse>(),
  adminLoginRes: APIRequestState.create<ILoginResponse>(),
};

interface LoginAPIResponse {
  success: boolean;
  data: ILoginResponse;
}

export const loginRequest = createApiThunk<ILoginResponse, ILoginRequest>(
  'auth/login',
  async (payload) => {
    const response = await apiService.post<LoginAPIResponse>(API_ROUTES.AUTH.LOGIN, payload);
    return response.data.data;
  },
);

export const adminLoginRequest = createApiThunk<ILoginResponse, ILoginRequest>(
  'auth/adminLogin',
  async (payload) => {
    const response = await apiService.post<LoginAPIResponse>(
      API_ROUTES.AUTH.LOGIN,
      { ...payload, isAdmin: true },
    );
    return response.data.data;
  },
);

export const signupRequest = createApiThunk<void, ISignUpRequest>(
  'auth/signup',
  (payload) => apiService.post<void>(API_ROUTES.AUTH.SIGNUP, payload),
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
});
