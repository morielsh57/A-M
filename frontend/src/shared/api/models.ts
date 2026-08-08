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

export interface IAPIRequestState<T = any> {
  status: EAPIStatus;
  error?: IAPIError;
  data?: T;
}

export abstract class APIRequestState {
  static create<T>(): IAPIRequestState<T> {
    return { status: EAPIStatus.IDLE };
  }
}
