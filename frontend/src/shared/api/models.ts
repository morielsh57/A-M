import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/** A request callback that can return raw data or an API response envelope. */
export type ApiThunkCallback<TData, TArgs> = (
  args: TArgs
) => Promise<TData | ApiSuccessResponse<TData>> | TData | ApiSuccessResponse<TData>;

export interface ApiSuccessResponse<TData, TMeta = unknown> {
  success: boolean;
  data: TData;
  meta?: TMeta;
}

export interface ApiService {
  request<TResponse = unknown, TMeta = unknown, TRequestData = unknown>(
    config: AxiosRequestConfig<TRequestData>,
  ): Promise<ApiSuccessResponse<TResponse, TMeta>>;
  get<TResponse = unknown, TMeta = unknown, TRequestData = unknown>(
    url: string,
    config?: AxiosRequestConfig<TRequestData>,
  ): Promise<ApiSuccessResponse<TResponse, TMeta>>;
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

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request state, errors, and pagination shared by API consumers.
export enum EAPIStatus {
  IDLE,
  PENDING,
  REJECTED,
  FULFILLED,
}

export interface IAPIError {
  message?: string;
  code?: number;
  details?: unknown;
  axiosError?: AxiosError;
}

export interface IPaginationMeta {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  next: string | null;
  previous: string | null;
}

export interface IMeta {
  pagination?: IPaginationMeta;
}

export interface IAPIRequestState<T = any, TMeta = IMeta> {
  status: EAPIStatus;
  error?: IAPIError;
  data?: T;
  meta?: TMeta;
}

export abstract class APIRequestState {
  static create<T, TMeta = IMeta>(): IAPIRequestState<T, TMeta> {
    return { status: EAPIStatus.IDLE };
  }
}
