import type { ActionReducerMapBuilder, Draft } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { APIRequestState, type IAPIRequestState } from '../../../shared/api/models';
import {
  createAPIReducerCases,
  type ApiDataStateType,
} from '../../../shared/store/utils';
import type {
  ISupplierNotification,
  ISupplierNotificationReadRequestParams,
  ISupplierNotificationsListRequestParams,
  SupplierNotificationsMeta,
} from './supplierNotifications.types';
import { SUPPLIER_NOTIFICATIONS_PAGE_SIZE } from './supplierNotifications.utils';

export interface SupplierNotificationsStoreState extends ApiDataStateType {
  supplierNotificationsReq: IAPIRequestState<ISupplierNotification[], SupplierNotificationsMeta>;
  markSupplierNotificationReadReq: IAPIRequestState<ISupplierNotification>;
}

const initialState: SupplierNotificationsStoreState = {
  supplierNotificationsReq: APIRequestState.create<ISupplierNotification[], SupplierNotificationsMeta>(),
  markSupplierNotificationReadReq: APIRequestState.create<ISupplierNotification>(),
};

export const getSupplierNotifications = createApiThunk<
  ISupplierNotification[],
  ISupplierNotificationsListRequestParams | undefined
>(
  'supplierNotifications/getSupplierNotifications',
  (params) => apiService.get<ISupplierNotification[], SupplierNotificationsMeta>(
    API_ROUTES.SUPPLIER.NOTIFICATIONS,
    {
      params: {
        page: 1,
        page_size: SUPPLIER_NOTIFICATIONS_PAGE_SIZE,
        ...params,
      }
    },
  ),
);

export const markSupplierNotificationRead = createApiThunk<
  ISupplierNotification,
  ISupplierNotificationReadRequestParams
>(
  'supplierNotifications/markSupplierNotificationRead',
  ({ notification_id }) => apiService.post<ISupplierNotification>(
    API_ROUTES.SUPPLIER.NOTIFICATION_READ(notification_id),
  ),
);

const updateNotificationInList = (
  state: Draft<ApiDataStateType>,
  notification: ISupplierNotification,
) => {
  const currentNotifications = state.supplierNotificationsReq.data as
    | ISupplierNotification[]
    | undefined;

  if (!currentNotifications) {
    return;
  }

  state.supplierNotificationsReq.data = currentNotifications.map((currentNotification) => (
    currentNotification.notification_id === notification.notification_id
      ? notification
      : currentNotification
  ));
};

export const supplierNotificationsStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getSupplierNotifications, 'supplierNotificationsReq', apiBuilder);
  createAPIReducerCases(
    markSupplierNotificationRead,
    'markSupplierNotificationReadReq',
    apiBuilder,
    { onFulfilled: updateNotificationInList },
  );
});
