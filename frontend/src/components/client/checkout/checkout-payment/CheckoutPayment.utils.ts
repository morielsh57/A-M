import { EAPIStatus, type IAPIRequestState } from '../../../../shared/api/models';

export type PayPalEnvironment = 'sandbox' | 'production';

export const getPayPalEnvironment = (
  environment = import.meta.env.REACT_APP_PAYPAL_ENVIRONMENT,
): PayPalEnvironment => (
  String(environment || '').trim().toLowerCase() === 'production'
    ? 'production'
    : 'sandbox'
);

export const PAYPAL_ENVIRONMENT = getPayPalEnvironment();

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
