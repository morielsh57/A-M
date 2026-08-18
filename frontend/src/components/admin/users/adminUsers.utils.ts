import type { IAPIError } from '../../../shared/api/models';
import type {
  IAdminUserCreateRequest,
  IAdminUser,
  IAdminUsersFormErrors,
  IAdminUsersFormValues,
  IAdminUserUpdateRequest,
} from './adminUsers.types';
import type { EUserRole } from '../../../shared/store/user/user.types';

export const EMPTY_ADMIN_USER_FORM_VALUES: IAdminUsersFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: '',
  is_active: true,
};

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const getAdminUserValues = (user?: IAdminUser): IAdminUsersFormValues => ({
  name: user?.name || '',
  email: user?.email || '',
  password: '',
  confirmPassword: '',
  phone: user?.phone || '',
  address: user?.address || '',
  is_active: user?.is_active ?? true,
});

export const getAdminUserRoleLabel = (role: EUserRole) => String(role).toLowerCase();

export const getAdminUserCreatePayload = (
  role: EUserRole,
  values: IAdminUsersFormValues,
): IAdminUserCreateRequest => ({
  name: values.name.trim(),
  email: values.email.trim().toLowerCase(),
  password: values.password,
  role,
  phone: values.phone.trim(),
  address: values.address.trim(),
  is_active: values.is_active,
});

export const getAdminUserUpdatePayload = (
  values: IAdminUsersFormValues,
): IAdminUserUpdateRequest => ({
  name: values.name.trim(),
  phone: values.phone.trim(),
  address: values.address.trim(),
  is_active: values.is_active,
});

export const getAdminUserFormErrorMessage = (
  error: unknown,
  fallback = 'The user could not be saved. Please try again.',
) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;
  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>).flat();
    if (messages.length) return messages.join(' ');
  }
  return apiError?.message || fallback;
};

export const validateAdminUserForm = (
  isEditMode: boolean,
  values: IAdminUsersFormValues,
): IAdminUsersFormErrors => {
  const errors: IAdminUsersFormErrors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!isEditMode) {
    if (!values.password) errors.password = 'Password is required.';
    else if (values.password.length < 8) errors.password = 'Password must contain at least 8 characters.';
    if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
};

export const getAdminUserInitials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

export const formatAdminUserDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};
