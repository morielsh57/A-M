import type { AxiosResponse } from 'axios';
import type { ApiSuccessResponse } from './models';

export const unwrapApiResponse = <TData>(
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

export const unwrapApiResponseEnvelope = <TData, TMeta = unknown>(
  response: AxiosResponse<ApiSuccessResponse<TData, TMeta> | TData>,
): ApiSuccessResponse<TData, TMeta> => {
  const payload = response.data;

  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return payload as ApiSuccessResponse<TData, TMeta>;
  }

  return {
    success: true,
    data: payload as TData,
  };
};

export const isApiSuccessResponse = <TData>(
  payload: TData | ApiSuccessResponse<TData>,
): payload is ApiSuccessResponse<TData> => (
    !!payload
    && typeof payload === 'object'
    && 'success' in payload
    && 'data' in payload
  );

