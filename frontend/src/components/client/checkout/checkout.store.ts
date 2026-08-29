import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../../shared/api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../../../shared/store/utils';
import type { PickupPoint } from './checkout-delivery/CheckoutDelivery.types';
import {
  getPickupPointsWithinRadius,
  PICKUP_PAGE_SIZE,
  PICKUP_SEARCH_RADIUS_KM,
} from './checkout-delivery/CheckoutDelivery.utils';

export interface IGetPickupPointsRequest {
  lat: number;
  lng: number;
  radius_km?: number;
  page_size?: number;
  is_active?: boolean;
}

export interface ICreatePayPalOrderRequest {
  idempotency_key: string;
  cart_product_ids: number[];
}

export interface ICapturePayPalOrderRequest {
  paypal_order_id: string;
}

export interface ICreateCheckoutOrderRequest {
  payment_id: number;
  pickup_point_id: number;
}

export interface ICheckoutPaymentItem {
  variant_id: number;
  product_id: number;
  product_name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
}

export interface IPayPalPayment {
  payment_id: number;
  paypal_order_id: string;
  paypal_capture_id?: string | null;
  status: string;
  amount: string | number;
  currency: string;
  approval_url?: string | null;
  items: ICheckoutPaymentItem[];
}

export interface ICheckoutOrder {
  order_id: number;
  payment_id: number;
  pickup_point_id: number;
  total_price: string | number;
  order_status: string;
  date_created: string;
  date_updated: string;
  items: ICheckoutPaymentItem[];
}

export interface CheckoutStoreState extends ApiDataStateType {
  selectedPickupPointId: number | null;
  getPickupPointsReq: IAPIRequestState<PickupPoint[]>;
  createPayPalOrderReq: IAPIRequestState<IPayPalPayment>;
  capturePayPalOrderReq: IAPIRequestState<IPayPalPayment>;
  createCheckoutOrderReq: IAPIRequestState<ICheckoutOrder>;
  checkoutSuccessOrder?: ICheckoutOrder;
  paymentStatusMessage?: string;
}

const initialState: CheckoutStoreState = {
  selectedPickupPointId: null,
  getPickupPointsReq: APIRequestState.create<PickupPoint[]>(),
  createPayPalOrderReq: APIRequestState.create<IPayPalPayment>(),
  capturePayPalOrderReq: APIRequestState.create<IPayPalPayment>(),
  createCheckoutOrderReq: APIRequestState.create<ICheckoutOrder>(),
};

const shouldUseMockPickupPoints = () => (
  String(import.meta.env.REACT_APP_USE_MOCK_PICKUP_POINTS || '').toLowerCase() === 'true'
);

export const setSelectedPickupPointId = createAction<number | null>('checkout/setSelectedPickupPointId');
export const clearSelectedPickupPoint = createAction('checkout/clearSelectedPickupPoint');
export const clearCheckoutPaymentState = createAction('checkout/clearCheckoutPaymentState');
export const setPaymentStatusMessage = createAction<string | undefined>('checkout/setPaymentStatusMessage');

export const getPickupPoints = createApiThunk<PickupPoint[], IGetPickupPointsRequest>(
  'checkout/getPickupPoints',
  async (params) => {
    if (shouldUseMockPickupPoints()) {
      return getPickupPointsWithinRadius({ lat: params.lat, lng: params.lng });
    }

    return apiService.get<PickupPoint[]>(API_ROUTES.PICKUP_POINTS, {
      params: {
        lat: params.lat,
        lng: params.lng,
        radius_km: params.radius_km ?? PICKUP_SEARCH_RADIUS_KM,
        page_size: params.page_size ?? PICKUP_PAGE_SIZE,
        is_active: params.is_active ?? true,
      },
    });
  },
);

export const createPayPalOrder = createApiThunk<IPayPalPayment, ICreatePayPalOrderRequest>(
  'checkout/createPayPalOrder',
  (payload) => apiService.post<IPayPalPayment, ICreatePayPalOrderRequest>(
    API_ROUTES.CHECKOUT.PAYPAL_ORDERS,
    payload,
  ),
);

export const capturePayPalOrder = createApiThunk<IPayPalPayment, ICapturePayPalOrderRequest>(
  'checkout/capturePayPalOrder',
  ({ paypal_order_id }) => apiService.post<IPayPalPayment>(
    API_ROUTES.CHECKOUT.PAYPAL_ORDER_CAPTURE(paypal_order_id),
  ),
);

export const createCheckoutOrder = createApiThunk<ICheckoutOrder, ICreateCheckoutOrderRequest>(
  'checkout/createCheckoutOrder',
  (payload) => apiService.post<ICheckoutOrder, ICreateCheckoutOrderRequest>(
    API_ROUTES.ORDERS,
    payload,
  ),
);

export const checkoutStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getPickupPoints, 'getPickupPointsReq', apiBuilder, {
    onPending: (state) => {
      state.getPickupPointsReq.data = [];
    },
  });
  createAPIReducerCases(createPayPalOrder, 'createPayPalOrderReq', apiBuilder);
  createAPIReducerCases(capturePayPalOrder, 'capturePayPalOrderReq', apiBuilder);
  createAPIReducerCases(createCheckoutOrder, 'createCheckoutOrderReq', apiBuilder, {
    onFulfilled: (state, order) => {
      state.checkoutSuccessOrder = order;
    },
  });

  builder
    .addCase(setSelectedPickupPointId, (state, action) => {
      state.selectedPickupPointId = action.payload;
    })
    .addCase(clearSelectedPickupPoint, (state) => {
      state.selectedPickupPointId = null;
    })
    .addCase(setPaymentStatusMessage, (state, action) => {
      state.paymentStatusMessage = action.payload;
    })
    .addCase(clearCheckoutPaymentState, (state) => {
      state.createPayPalOrderReq = APIRequestState.create<IPayPalPayment>();
      state.capturePayPalOrderReq = APIRequestState.create<IPayPalPayment>();
      state.createCheckoutOrderReq = APIRequestState.create<ICheckoutOrder>();
      state.checkoutSuccessOrder = undefined;
      state.paymentStatusMessage = undefined;
    });
});
