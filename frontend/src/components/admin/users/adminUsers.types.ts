import type { EUserRole, IUser } from '../../../shared/store/user/user.types';

export interface IAdminUser extends Omit<IUser, 'date_created'> {
  is_active: boolean;
  is_valid_email: boolean;
  date_created: string;
}

export interface IAdminUsersListRequestParams {
  page?: number;
  page_size?: number;
  search?: string;
  role: EUserRole;
  is_active?: boolean;
}

export interface IAdminUserDetailRequestParams {
  user_id: IUser['user_id'];
}

export interface IAdminUserUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface IAdminUserCreateRequest {
  name: string;
  email: string;
  password: string;
  role: EUserRole;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface IUpdateAdminUserRequestParams extends IAdminUserDetailRequestParams {
  payload: IAdminUserUpdateRequest;
}

export interface IAdminUsersFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface IAdminUsersFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}
