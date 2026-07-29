import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../app/constants';
import { apiService, createApiThunk } from '../api/axios';
import { APIRequestState, type IAPIRequestState } from '../api/models';
import { createAPIReducerCases, type ApiDataStateType } from './utils';
import { IGetUserByIdResponse, IUser } from './user.types';
import { getItemFromLocalStorage, setItemInLocalStorage } from '../utils/localStorage.utils';
import { API_ROUTES } from '../../app/routing';

export interface UserStoreState extends ApiDataStateType {
  getUserByIdRequest: IAPIRequestState<IGetUserByIdResponse>;
  user?: IUser;
}

const initialState: UserStoreState = {
  getUserByIdRequest: APIRequestState.create<IGetUserByIdResponse>(),
  user: getItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER) || undefined,
};

export const getUserById = createApiThunk(
  'user/userById',
  (params?: {id?: number}) => apiService.get<IGetUserByIdResponse>(`${API_ROUTES.USERS}/${params?.id}`),
);

export const userStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getUserById, 'getUserByIdRequest', apiBuilder, {
    onFulfilled: (state, payload) => {
      const user = payload.data ?? {};
      state.user = user;
      setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER, user);
    },
  });
});
