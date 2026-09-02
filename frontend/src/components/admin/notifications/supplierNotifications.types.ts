import type { IMeta } from '../../../shared/api/models';

export enum ESupplierNotificationType {
  NEW_ORDER = 'new_order',
  CANCELLED_ORDER = 'cancelled_order',
}

export interface ISupplierNotification {
  notification_id: number;
  order_id: number;
  order_status: string;
  type: ESupplierNotificationType | string;
  is_read: boolean;
  date_created: string;
}

export interface ISupplierNotificationsListRequestParams {
  page?: number;
  page_size?: number;
}

export interface ISupplierNotificationReadRequestParams {
  notification_id: ISupplierNotification['notification_id'];
}

export type SupplierNotificationsMeta = IMeta;
