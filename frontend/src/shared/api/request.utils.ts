import { apiService } from './axios';
import type { ApiRequestArgs } from './request.types';

export const runApiRequest = (payload?: ApiRequestArgs) =>
  apiService.request({
    url: payload?.url || '',
    method: payload?.method || 'GET',
    data: payload?.body,
  });
