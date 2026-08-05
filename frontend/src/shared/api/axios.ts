import type { EnhancedStore } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
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
type ApiThunkCallback<TData, TArgs> = (args: TArgs) => Promise<TData> | TData;

interface ApiSuccessResponse<TData> {
  success: boolean;
  data: TData;
  meta?: unknown;
}

export interface ApiService {
  request<TResponse = unknown, TRequestData = unknown>(
    config: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  get<TResponse = unknown, TRequestData = unknown>(
    url: string,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  delete<TResponse = unknown, TRequestData = unknown>(
    url: string,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  head<TResponse = unknown, TRequestData = unknown>(
    url: string,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  options<TResponse = unknown, TRequestData = unknown>(
    url: string,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  post<TResponse = unknown, TRequestData = unknown>(
    url: string,
    data?: TRequestData,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  put<TResponse = unknown, TRequestData = unknown>(
    url: string,
    data?: TRequestData,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  patch<TResponse = unknown, TRequestData = unknown>(
    url: string,
    data?: TRequestData,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<TResponse>;
}

const unwrapApiResponse = <TData>(
  response: AxiosResponse<ApiSuccessResponse<TData> | TData>,
): TData => {
  const payload = response.data;

  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    payload.success === true &&
    'data' in payload
  ) {
    return payload.data as TData;
  }

  return payload as TData;
};

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
        return await requestCallback(args as TArgs);
        // eslint-disable-next-line
      } catch (e: unknown) {
        const axiosError = e as AxiosError;
        const responseData = axiosError?.response?.data;
        const structuredError = responseData as {
          message?: string;
          msg?: string;
          detail?: string;
          error?: { message?: string; details?: unknown };
        } | undefined;
        const responseMessage = typeof responseData === 'string'
          ? responseData
          : (
            structuredError?.error?.message
            || structuredError?.message
            || structuredError?.msg
            || structuredError?.detail
          );

        return rejectWithValue({
          message: responseMessage || axiosError?.message,
          code: axiosError?.response?.status ?? axiosError?.status,
          details: structuredError?.error?.details,
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
    request: async <TResponse, TRequestData = unknown>(
      config: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.request<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(config);
      return unwrapApiResponse(response);
    },
    get: async <TResponse, TRequestData = unknown>(
      url: string,
      config?: AxiosRequestConfig<TRequestData>,
    ) => {
      const response = await instance.get<ApiSuccessResponse<TResponse> | TResponse, AxiosResponse<ApiSuccessResponse<TResponse> | TResponse>, TRequestData>(url, config);
      return unwrapApiResponse(response);
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
