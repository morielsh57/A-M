import type { EnhancedStore } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosHeaders } from 'axios';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../app/constants';
import { API_ROUTES, APP_ROUTING_PATHS } from '../../app/routing';
import type { IAPIError } from './models';
import { addAuthorizationHeaderInterceptor } from './interceptors';
import {
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  setItemInLocalStorage,
} from '../utils/localStorage.utils';

export const InternalError = {
  message: 'Internal error during request.',
  code: 500,
};

/**
 * Injecting the store to be able to use it inside axios interceptors
 * https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
 */

// eslint-disable-next-line
let store: EnhancedStore | undefined;

export const injectStoreAxios = (_store: EnhancedStore) => {
  store = _store;
};

/**
 * The api thunk callback type (because we cannot import it from redux toolkit
 */
type ApiThunkCallback<TData, TArgs> = (args: TArgs) => Promise<AxiosResponse<TData> | TData>;

/**
 * Create an api thunk, which will run the provided promise and await it
 * @param typePrefix The type prefix of the action
 * @param requestCallback A callback function which returns an api request using axios
 */
export const createApiThunk = <TData, TArgs = void>(
  typePrefix: string,
  requestCallback: ApiThunkCallback<TData, TArgs>,
) => {
  return createAsyncThunk<TData, TArgs, { rejectValue: IAPIError }>(
    typePrefix,
    async (args, { rejectWithValue }) => {
      try {
        const response = await requestCallback(args as TArgs);
        return (response as AxiosResponse<TData>)?.data ?? (response as TData);
        // eslint-disable-next-line
      } catch (e: unknown) {
        const axiosError = e as AxiosError;
        return rejectWithValue({
          message: axiosError?.message,
          code: axiosError?.response?.status ?? axiosError?.status,
          axiosError,
        });
      }
    },
  );
};

/**
 * An axios instance using our base url, and later our token
 */
const BASE_URL = process.env.REACT_APP_BASE_URL_SERVER || '';

export const URL_API = BASE_URL;

// Create the main apiService with the default base URL
export const apiService = createAxiosInstance(BASE_URL);

/**
 * Create an Axios instance with the specified base URL
 * @param baseURL The base URL
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

const authEndpoints = [API_ROUTES.AUTH.LOGIN, API_ROUTES.AUTH.SIGNUP, API_ROUTES.AUTH.REFRESH];

const shouldSkipRefreshFlow = (url?: string): boolean => {
  if (!url) return false;
  return authEndpoints.some((endpoint) => url.includes(endpoint));
};

const clearAuthAndRedirectToLogin = () => {
  removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN);

  if (typeof window !== 'undefined' && !window.location.href.includes(APP_ROUTING_PATHS.AUTH)) {
    window.location.href = `${APP_ROUTING_PATHS.AUTH}/${APP_ROUTING_PATHS.LOGIN}`;
  }
};

const refreshAccessToken = async (baseURL: string): Promise<string | null> => {
  const refreshToken = getItemFromLocalStorage<string>(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const refreshClient = axios.create({ baseURL });
    const response = await refreshClient.post<{ access: string }>(API_ROUTES.AUTH.REFRESH, {
      refresh: refreshToken,
    });

    const newAccessToken = response.data?.access;
    if (!newAccessToken) return null;

    setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    return newAccessToken;
  } catch (error) {
    return null;
  }
};

function createAxiosInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
  });

  // Add authorization header interceptor
  instance.interceptors.request.use(addAuthorizationHeaderInterceptor);

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const statusCode = error.response?.status;

      if (
        statusCode !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        shouldSkipRefreshFlow(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(baseURL).finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;
      if (!newAccessToken) {
        clearAuthAndRedirectToLogin();
        return Promise.reject(error);
      }

      const headers = new AxiosHeaders(originalRequest.headers);
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      originalRequest.headers = headers;

      return instance(originalRequest);
    },
  );

  return instance;
}
