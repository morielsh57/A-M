import React, { useEffect, useMemo, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminForm from '../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../shared/components/admin-form/AdminFormActions';
import AdminFormCheckbox from '../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormError from '../../../shared/components/admin-form/AdminFormError';
import AdminFormField from '../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../shared/components/admin-form/AdminFormInput';
import AdminFormTextarea from '../../../shared/components/admin-form/AdminFormTextarea';
import { createAdminCustomer } from './adminCustomers.store';
import type { AdminManagedRole } from './adminCustomers.types';

interface CustomerCreateValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  is_active: boolean;
}

interface CustomerCreateErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface AdminCustomerCreateFormProps {
  accountLabel?: string;
  accountRole?: AdminManagedRole;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
}

const EMPTY_VALUES: CustomerCreateValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: '',
  is_active: true,
};

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const getErrorMessage = (error: unknown, accountLabel: string) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;
  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>).flat();
    if (messages.length) return messages.join(' ');
  }
  return apiError?.message || `The ${accountLabel} could not be created. Please try again.`;
};

const validate = (values: CustomerCreateValues): CustomerCreateErrors => {
  const errors: CustomerCreateErrors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Password is required.';
  else if (values.password.length < 8) errors.password = 'Password must contain at least 8 characters.';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
};

const AdminCustomerCreateForm: React.FC<AdminCustomerCreateFormProps> = ({
  accountLabel = 'customer',
  accountRole = 'Customer',
  onCancel,
  onDirtyChange,
  onSaved,
}) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { createCustomerReq } = useAppSelector((store) => store.adminCustomersStoreReducer);
  const [values, setValues] = useState<CustomerCreateValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<CustomerCreateErrors>({});
  const [requestError, setRequestError] = useState<string>();
  const snapshot = useMemo(() => JSON.stringify(values), [values]);
  const isSubmitting = createCustomerReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    onDirtyChange(snapshot !== JSON.stringify(EMPTY_VALUES));
  }, [onDirtyChange, snapshot]);

  const updateValue = <K extends keyof CustomerCreateValues>(
    key: K,
    value: CustomerCreateValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setRequestError(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setRequestError(undefined);
    if (Object.keys(validationErrors).length) return;

    try {
      await dispatch(createAdminCustomer({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: accountRole,
        phone: values.phone.trim(),
        address: values.address.trim(),
        is_active: values.is_active,
      })).unwrap();
      onDirtyChange(false);
      addToast(`${accountLabel[0].toUpperCase()}${accountLabel.slice(1)} created successfully.`, {
        appearance: 'success',
        autoDismiss: true,
      });
      onSaved();
    } catch (error) {
      setRequestError(getErrorMessage(error, accountLabel));
    }
  };

  return (
    <AdminForm onSubmit={handleSubmit}>
      <section className="admin-form__section">
        <h3 className="admin-form__section-title">Account information</h3>
        <div className="admin-form__grid">
          <AdminFormField htmlFor="new-customer-name" label="Name" error={errors.name}>
            <AdminFormInput
              id="new-customer-name"
              autoComplete="name"
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField htmlFor="new-customer-email" label="Email" error={errors.email}>
            <AdminFormInput
              id="new-customer-email"
              autoComplete="email"
              type="email"
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField htmlFor="new-customer-password" label="Password" error={errors.password}>
            <AdminFormInput
              id="new-customer-password"
              autoComplete="new-password"
              type="password"
              value={values.password}
              onChange={(event) => updateValue('password', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField
            htmlFor="new-customer-confirm-password"
            label="Confirm password"
            error={errors.confirmPassword}
          >
            <AdminFormInput
              id="new-customer-confirm-password"
              autoComplete="new-password"
              type="password"
              value={values.confirmPassword}
              onChange={(event) => updateValue('confirmPassword', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField htmlFor="new-customer-phone" label="Phone">
            <AdminFormInput
              id="new-customer-phone"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => updateValue('phone', event.target.value)}
            />
          </AdminFormField>
          <AdminFormField htmlFor="new-customer-address" label="Address">
            <AdminFormTextarea
              id="new-customer-address"
              autoComplete="street-address"
              value={values.address}
              onChange={(event) => updateValue('address', event.target.value)}
            />
          </AdminFormField>
        </div>
        <AdminFormCheckbox
          label={`Active ${accountLabel} account`}
          checked={values.is_active}
          onChange={(event) => updateValue('is_active', event.target.checked)}
        />
      </section>
      <AdminFormError message={requestError} />
      <AdminFormActions
        isSubmitting={isSubmitting}
        submitLabel={`Create ${accountLabel}`}
        onCancel={onCancel}
      />
    </AdminForm>
  );
};

export default AdminCustomerCreateForm;
