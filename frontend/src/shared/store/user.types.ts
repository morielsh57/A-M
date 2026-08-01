export enum EUserRole {
  ADMIN = 'Admin',
  SUPPLIER = 'Supplier',
  CUSTOMER = 'Customer',
}

export interface IUserNotification {
  notification_id?: string;
  orderNumber?: string | number;
  isRead?: boolean;
  type?: string;
}

export interface IUser {
  user_id: string;
  name: string;
  email: string;
  role: EUserRole;
  phone: string;
  address: string;
  avatar?: string;
  isValidEmail?: boolean;
  date_created: Date;
}

export interface IGetUserResponse {
  data: IUser;
  msg: string;
}

export interface IAdminOrSupplierUser extends IUser {
  unreadCounter?: number;
  notifications?: IUserNotification[];
  supplier_id?: string | number;
}

export interface IGetAdminOrSupplierByIdResponse {
  data: IAdminOrSupplierUser;
  msg: string;
}