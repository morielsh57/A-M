export type AdminUserId = string | number;
export type AdminManagedRole = 'Customer' | 'Admin' | 'Supplier';

export interface IAdminCustomer {
  user_id: AdminUserId;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: AdminManagedRole | string;
  is_active: boolean;
  is_valid_email: boolean;
  date_created: string;
}

export interface IAdminCustomersListRequestParams {
  page?: number;
  page_size?: number;
  search?: string;
  role: AdminManagedRole;
  is_active?: boolean;
}

export interface IAdminCustomerDetailRequestParams {
  user_id: AdminUserId;
}

export interface IAdminCustomerUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  role?: AdminManagedRole;
}

export interface IAdminCustomerCreateRequest {
  name: string;
  email: string;
  password: string;
  role: AdminManagedRole;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface IUpdateAdminCustomerRequestParams extends IAdminCustomerDetailRequestParams {
  payload: IAdminCustomerUpdateRequest;
}
