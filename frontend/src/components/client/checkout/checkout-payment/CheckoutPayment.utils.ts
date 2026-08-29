import { EAPIStatus, type IAPIRequestState } from '../../../../shared/api/models';

export const PAYPAL_ENVIRONMENT = 'sandbox';

export const createCheckoutIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const isRequestPending = (request: IAPIRequestState) => (
  request.status === EAPIStatus.PENDING
);

export const getRequestErrorMessage = (...requests: IAPIRequestState[]) => (
  requests.find((request) => request.error)?.error?.message
);
