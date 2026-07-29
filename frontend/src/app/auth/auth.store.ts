import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import {  createReducer } from '@reduxjs/toolkit';
import { AUTH_LOCAL_STORAGE_KEYS } from '../constants';
import { apiService, createApiThunk } from '../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../shared/api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../../shared/store/utils';
import { setItemInLocalStorage } from '../../shared/utils/localStorage.utils';
import { ILoginRequest, ILoginResponse } from './auth.types';
import { API_ROUTES } from '../routing';

export interface AuthStoreState extends ApiDataStateType {
  loginRes: IAPIRequestState<ILoginResponse>;
}

const initialState: AuthStoreState = {
  loginRes: APIRequestState.create<ILoginResponse>(),
};

export const loginRequest = createApiThunk<ILoginResponse, ILoginRequest>(
  'auth/login',
  (payload) => apiService.post<ILoginResponse>(API_ROUTES.AUTH.LOGIN, payload),
);

export const authStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(loginRequest, 'loginRes', apiBuilder, {
    onFulfilled: (_, payload) => {
      setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN, payload.access);
      setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN, payload.refresh);
    },
  });
});
