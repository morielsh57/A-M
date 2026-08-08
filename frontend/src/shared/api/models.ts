import type { AxiosError } from 'axios';

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
