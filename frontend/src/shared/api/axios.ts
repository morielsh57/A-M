import type { EnhancedStore } from '@reduxjs/toolkit';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import axios, { AxiosHeaders } from 'axios';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../app/constants';
import { API_ROUTES, APP_ROUTING_PATHS } from '../../app/routing';
import { addAuthorizationHeaderInterceptor } from './interceptors';
import type { ApiService, ApiSuccessResponse, RetryableRequestConfig } from './models';
import { unwrapApiResponse, unwrapApiResponseEnvelope } from './response.utils';

// Preserve existing imports while keeping helpers independent of this client.
export { createApiThunk } from './api-thunk';
export type { ApiService, ApiSuccessResponse } from './models';
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

let store: EnhancedStore | undefined;

export const injectStoreAxios = (_store: EnhancedStore) => {
  store = _store;
};

/**
 * An axios instance using our base url, and later our token
 */
const BASE_URL = process.env.REACT_APP_BASE_URL_SERVER || '';

export const URL_API = BASE_URL;

// Create the main apiService with the default base URL
export const apiService = createAxiosInstance(BASE_URL);

// Share one in-flight refresh across requests in this browser tab.
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
    const response = await refreshClient.post<ApiSuccessResponse<{
      access: string;
      refresh?: string;
    }>>(API_ROUTES.AUTH.REFRESH, { refresh: refreshToken });
    const refreshData = unwrapApiResponse(response);

    const newAccessToken = refreshData.access;
    if (!newAccessToken) return null;

    setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    if (refreshData.refresh) {
      setItemInLocalStorage(
        AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN,
        refreshData.refresh,
      );
    }
    return newAccessToken;
  } catch (error) {
    return null;
  }
};

function createApiService(instance: AxiosInstance): ApiService {
  return {
    request: async <TResponse, TMeta = unknown, TRequestData = unknown>(
      config: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.request<ApiSuccessResponse<TResponse, TMeta> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse, TMeta> | TResponse>, TRequestData>(config);
      return unwrapApiResponseEnvelope<TResponse, TMeta>(response);
    },
    get: async <TResponse, TMeta = unknown, TRequestData = unknown>(
      url: string,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.get<ApiSuccessResponse<TResponse, TMeta> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse, TMeta> | TResponse>, TRequestData>(url, config);
      return unwrapApiResponseEnvelope<TResponse, TMeta>(response);
    },
    delete: async <TResponse, TRequestData = unknown>(
      url: string,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.delete<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, config);
      return unwrapApiResponse(response);
    },
    head: async <TResponse, TRequestData = unknown>(
      url: string,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.head<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, config);
      return unwrapApiResponse(response);
    },
    options: async <TResponse, TRequestData = unknown>(
      url: string,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.options<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, config);
      return unwrapApiResponse(response);
    },
    post: async <TResponse, TRequestData = unknown>(
      url: string,
      data?: TRequestData,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.post<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, data, config);
      return unwrapApiResponse(response);
    },
    put: async <TResponse, TRequestData = unknown>(
      url: string,
      data?: TRequestData,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.put<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, data, config);
      return unwrapApiResponse(response);
    },
    patch: async <TResponse, TRequestData = unknown>(
      url: string,
      data?: TRequestData,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.patch<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, data, config);
      return unwrapApiResponse(response);
    },
  };
}

function createAxiosInstance(baseURL: string): ApiService {
  const instance = axios.create({
    baseURL,
  });

  // Add authorization header interceptor
  instance.interceptors.request.use(addAuthorizationHeaderInterceptor);

  // Deduplicate concurrent 401 refresh attempts by sharing a single refresh promise,
  // then retry each failed request with the refreshed access token.
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

  return createApiService(instance);
}
