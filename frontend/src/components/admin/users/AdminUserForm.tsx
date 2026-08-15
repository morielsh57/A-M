import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Spin } from 'antd';
import { useToasts } from 'react-toast-notifications';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminForm from '../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../shared/components/admin-form/AdminFormActions';
import AdminFormCheckbox from '../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormError from '../../../shared/components/admin-form/AdminFormError';
import AdminFormField from '../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../shared/components/admin-form/AdminFormInput';
import AdminFormSelect from '../../../shared/components/admin-form/AdminFormSelect';
import AdminFormTextarea from '../../../shared/components/admin-form/AdminFormTextarea';
import {
  createAdminCustomer,
  getAdminCustomer,
  updateAdminCustomer,
} from '../customers/adminCustomers.store';
import type {
  AdminManagedRole,
  AdminUserId,
  IAdminCustomer,
} from '../customers/adminCustomers.types';
import './AdminUserForm.scss';

interface AdminUserFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  role: AdminManagedRole;
  is_active: boolean;
}

interface AdminUserFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

interface AdminUserFormProps {
  mode: 'create' | 'edit';
  userId?: AdminUserId;
  initialRole?: AdminManagedRole;
  allowedRoles?: AdminManagedRole[];
  accountLabel?: string;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onLoadError?: (message: string) => void;
  onSaved: (user: IAdminCustomer) => void;
}

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const DEFAULT_ROLES: AdminManagedRole[] = ['Customer', 'Admin', 'Supplier'];

const createEmptyValues = (role: AdminManagedRole): AdminUserFormValues => ({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: '',
  role,
  is_active: true,
});

const mapUserToValues = (user: IAdminCustomer): AdminUserFormValues => ({
  name: user.name,
  email: user.email,
  password: '',
  confirmPassword: '',
  phone: user.phone || '',
  address: user.address || '',
  role: user.role as AdminManagedRole,
  is_active: user.is_active,
});

const getInitials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

const capitalize = (value: string) => `${value[0]?.toUpperCase() || ''}${value.slice(1)}`;

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;
  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>).flat();
    if (messages.length) return messages.join(' ');
  }
  return apiError?.message || fallback;
};

const validateValues = (
  values: AdminUserFormValues,
  mode: AdminUserFormProps['mode'],
  allowedRoles: AdminManagedRole[],
): AdminUserFormErrors => {
  const errors: AdminUserFormErrors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!allowedRoles.includes(values.role)) errors.role = 'Select an authorized role.';
  if (mode === 'create') {
    if (!values.password) errors.password = 'Password is required.';
    else if (values.password.length < 8) errors.password = 'Password must contain at least 8 characters.';
    if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
};

const AdminUserForm: React.FC<AdminUserFormProps> = ({
  accountLabel = 'user',
  allowedRoles = DEFAULT_ROLES,
  initialRole = 'Supplier',
  mode,
  onCancel,
  onDirtyChange,
  onLoadError,
  onSaved,
  userId,
}) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { createCustomerReq, customerByIdReq, updateCustomerReq } = useAppSelector(
    (store) => store.adminCustomersStoreReducer,
  );
  const currentAdmin = useAppSelector((store) => store.userStoreReducer.adminOrSupplierUser);
  const userReq = userId !== undefined ? customerByIdReq[String(userId)] : undefined;
  const loadedUser = userReq?.data;
  const initialValues = useMemo(() => createEmptyValues(initialRole), [initialRole]);
  const [values, setValues] = useState<AdminUserFormValues>(initialValues);
  const [initialSnapshot, setInitialSnapshot] = useState(JSON.stringify(initialValues));
  const [errors, setErrors] = useState<AdminUserFormErrors>({});
  const [requestError, setRequestError] = useState<string>();
  const snapshot = useMemo(() => JSON.stringify(values), [values]);
  const isEditingCurrentAdministrator = mode === 'edit'
    && loadedUser?.role === 'Admin'
    && String(currentAdmin?.user_id) === String(userId);
  const isSubmitting = mode === 'create'
    ? createCustomerReq.status === EAPIStatus.PENDING
    : updateCustomerReq.status === EAPIStatus.PENDING;
  const isLoading = mode === 'edit' && (!userReq || userReq.status === EAPIStatus.PENDING);

  useEffect(() => {
    if (mode === 'edit' && userId !== undefined && !userReq) {
      void dispatch(getAdminCustomer({ user_id: userId }));
    }
  }, [dispatch, mode, userId, userReq]);

  useEffect(() => {
    if (!loadedUser) return;
    const nextValues = mapUserToValues(loadedUser);
    setValues(nextValues);
    setInitialSnapshot(JSON.stringify(nextValues));
  }, [loadedUser]);

  useEffect(() => {
    if (userReq?.status !== EAPIStatus.REJECTED) return;
    onLoadError?.(getErrorMessage(userReq.error, 'The user could not be loaded.'));
  }, [onLoadError, userReq?.error, userReq?.status]);

  useEffect(() => {
    onDirtyChange?.(snapshot !== initialSnapshot);
  }, [initialSnapshot, onDirtyChange, snapshot]);

  const updateValue = <K extends keyof AdminUserFormValues>(
    key: K,
    value: AdminUserFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setRequestError(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateValues(values, mode, allowedRoles);
    setErrors(validationErrors);
    setRequestError(undefined);
    if (Object.keys(validationErrors).length) return;

    try {
      const savedUser = mode === 'create'
        ? await dispatch(createAdminCustomer({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          phone: values.phone.trim(),
          address: values.address.trim(),
          role: values.role,
          is_active: values.is_active,
        })).unwrap()
        : await dispatch(updateAdminCustomer({
          user_id: userId as AdminUserId,
          payload: {
            name: values.name.trim(),
            phone: values.phone.trim(),
            address: values.address.trim(),
            role: isEditingCurrentAdministrator ? 'Admin' : values.role,
            is_active: isEditingCurrentAdministrator ? true : values.is_active,
          },
        })).unwrap();

      setInitialSnapshot(JSON.stringify(values));
      onDirtyChange?.(false);
      addToast(`${capitalize(accountLabel)} ${mode === 'create' ? 'created' : 'updated'} successfully.`, {
        appearance: 'success',
        autoDismiss: true,
      });
      onSaved(savedUser);
    } catch (error) {
      setRequestError(getErrorMessage(error, `The ${accountLabel} could not be saved. Please try again.`));
    }
  };

  if (isLoading) {
    return <div className="admin-user-form__loading"><Spin size="large" /> Loading user...</div>;
  }

  return (
    <AdminForm onSubmit={handleSubmit}>
      <section className="admin-form__section">
        <div className="admin-user-form__identity">
          <Avatar className="admin-user-form__avatar" size={64}>{getInitials(values.name)}</Avatar>
          <div>
            <h3 className="admin-form__section-title">Account information</h3>
            <p className="admin-user-form__avatar-help">
              Initials are used because avatar uploads are not supported by the current API.
            </p>
          </div>
        </div>
        <div className="admin-form__grid">
          <AdminFormField htmlFor="admin-user-name" label="Name" error={errors.name}>
            <AdminFormInput
              id="admin-user-name"
              autoComplete="name"
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField htmlFor="admin-user-email" label="Email" error={errors.email}>
            <AdminFormInput
              id="admin-user-email"
              autoComplete="email"
              disabled={mode === 'edit'}
              readOnly={mode === 'edit'}
              type="email"
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
            />
          </AdminFormField>
          {mode === 'create' && (
            <>
              <AdminFormField htmlFor="admin-user-password" label="Password" error={errors.password}>
                <AdminFormInput
                  id="admin-user-password"
                  autoComplete="new-password"
                  type="password"
                  value={values.password}
                  onChange={(event) => updateValue('password', event.target.value)}
                />
              </AdminFormField>
              <AdminFormField
                htmlFor="admin-user-confirm-password"
                label="Confirm password"
                error={errors.confirmPassword}
              >
                <AdminFormInput
                  id="admin-user-confirm-password"
                  autoComplete="new-password"
                  type="password"
                  value={values.confirmPassword}
                  onChange={(event) => updateValue('confirmPassword', event.target.value)}
                />
              </AdminFormField>
            </>
          )}
          <AdminFormField htmlFor="admin-user-phone" label="Phone">
            <AdminFormInput
              id="admin-user-phone"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => updateValue('phone', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField htmlFor="admin-user-role" label="Role" error={errors.role}>
            {mode === 'create' ? (
              <AdminFormSelect
                id="admin-user-role"
                disabled
                value={values.role}
                options={[{ value: values.role, label: values.role }]}
                onChange={() => undefined}
              />
            ) : (
              <AdminFormSelect
                id="admin-user-role"
                disabled={isEditingCurrentAdministrator}
                value={values.role}
                options={allowedRoles.map((role) => ({ value: role, label: role }))}
                onChange={(value) => updateValue('role', value as AdminManagedRole)}
              />
            )}
          </AdminFormField>
          <AdminFormField htmlFor="admin-user-address" label="Address">
            <AdminFormTextarea
              id="admin-user-address"
              autoComplete="street-address"
              value={values.address}
              onChange={(event) => updateValue('address', event.target.value)}
            />
          </AdminFormField>
        </div>
        <AdminFormCheckbox
          label={`Active ${accountLabel} account`}
          checked={values.is_active}
          disabled={isEditingCurrentAdministrator}
          onChange={(event) => updateValue('is_active', event.target.checked)}
        />
        {isEditingCurrentAdministrator && (
          <p className="admin-user-form__protected-note">
            You cannot deactivate your own account or remove your Administrator role.
          </p>
        )}
      </section>
      <AdminFormError message={requestError} />
      <AdminFormActions
        isSubmitting={isSubmitting}
        submitLabel={`${mode === 'create' ? 'Create' : 'Save'} ${accountLabel}`}
        onCancel={onCancel}
      />
    </AdminForm>
  );
};

export default AdminUserForm;
