import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminForm from '../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../shared/components/admin-form/AdminFormActions';
import AdminFormCheckbox from '../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormError from '../../../shared/components/admin-form/AdminFormError';
import AdminFormField from '../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../shared/components/admin-form/AdminFormInput';
import AdminFormTextarea from '../../../shared/components/admin-form/AdminFormTextarea';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import { getAdminCustomer, updateAdminCustomer } from './adminCustomers.store';
import './AdminCustomerEditPage.scss';

interface CustomerFormValues {
  name: string;
  phone: string;
  address: string;
  is_active: boolean;
}

const EMPTY_VALUES: CustomerFormValues = {
  name: '',
  phone: '',
  address: '',
  is_active: true,
};

const getErrorMessage = (error: unknown) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;
  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>).flat();
    if (messages.length) return messages.join(' ');
  }
  return apiError?.message || 'The customer could not be saved. Please try again.';
};

const AdminCustomerEditPage: React.FC = () => {
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const { customerByIdReq, updateCustomerReq } = useAppSelector(
    (store) => store.adminCustomersStoreReducer,
  );
  const customerReq = userId ? customerByIdReq[String(userId)] : undefined;
  const customer = customerReq?.data;
  const [values, setValues] = useState<CustomerFormValues>(EMPTY_VALUES);
  const [initialSnapshot, setInitialSnapshot] = useState(JSON.stringify(EMPTY_VALUES));
  const [nameError, setNameError] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const listPath = APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.CUSTOMERS);
  const currentSnapshot = useMemo(() => JSON.stringify(values), [values]);
  const isDirty = currentSnapshot !== initialSnapshot;
  const isSubmitting = updateCustomerReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (userId && !customerReq) void dispatch(getAdminCustomer({ user_id: userId }));
  }, [customerReq, dispatch, userId]);

  useEffect(() => {
    if (!customer) return;
    const nextValues = {
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      is_active: customer.is_active,
    };
    setValues(nextValues);
    setInitialSnapshot(JSON.stringify(nextValues));
  }, [customer]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  const leavePage = () => {
    if (!isDirty) {
      navigate(listPath);
      return;
    }
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'Your customer changes have not been saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: () => navigate(listPath),
    });
  };

  const updateValue = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setRequestError(undefined);
    if (key === 'name') setNameError(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setNameError('Name is required.');
      return;
    }
    if (!userId) return;

    setRequestError(undefined);
    try {
      await dispatch(updateAdminCustomer({
        user_id: userId,
        payload: {
          name: values.name.trim(),
          phone: values.phone.trim(),
          address: values.address.trim(),
          is_active: values.is_active,
        },
      })).unwrap();
      setInitialSnapshot(JSON.stringify(values));
      addToast('Customer updated successfully.', { appearance: 'success', autoDismiss: true });
      navigate(listPath);
    } catch (error) {
      setRequestError(getErrorMessage(error));
    }
  };

  if (!userId || customerReq?.status === EAPIStatus.REJECTED) {
    return (
      <AdminTablePageLayout
        eyebrow="User management"
        title="Edit customer"
        subtitle="The requested customer could not be loaded."
      >
        <Alert
          showIcon
          type="error"
          message="Customer could not be loaded"
          description={getErrorMessage(customerReq?.error)}
          action={<AppButton variant="secondary" onClick={() => navigate(listPath)}>Back to customers</AppButton>}
        />
      </AdminTablePageLayout>
    );
  }

  return (
    <AdminTablePageLayout
      eyebrow="User management"
      title={customer ? `Edit ${customer.name}` : 'Edit customer'}
      subtitle="Update the customer information and account status permitted by the backend."
    >
      <div className="admin-customer-edit-page__card">
        {!customer ? (
          <div className="admin-customer-edit-page__loading"><Spin size="large" /> Loading customer...</div>
        ) : (
          <AdminForm onSubmit={handleSubmit}>
            <section className="admin-form__section">
              <h2 className="admin-form__section-title">Customer details</h2>
              <div className="admin-form__grid">
                <AdminFormField htmlFor="customer-name" label="Name" error={nameError}>
                  <AdminFormInput
                    id="customer-name"
                    value={values.name}
                    onChange={(event) => updateValue('name', event.target.value)}
                  />
                </AdminFormField>
                <AdminFormField htmlFor="customer-email" label="Email">
                  <AdminFormInput id="customer-email" value={customer.email} disabled readOnly />
                </AdminFormField>
                <AdminFormField htmlFor="customer-phone" label="Phone">
                  <AdminFormInput
                    id="customer-phone"
                    value={values.phone}
                    onChange={(event) => updateValue('phone', event.target.value)}
                  />
                </AdminFormField>
                <AdminFormField htmlFor="customer-address" label="Address">
                  <AdminFormTextarea
                    id="customer-address"
                    value={values.address}
                    onChange={(event) => updateValue('address', event.target.value)}
                  />
                </AdminFormField>
              </div>
              <AdminFormCheckbox
                label="Active customer account"
                checked={values.is_active}
                onChange={(event) => updateValue('is_active', event.target.checked)}
              />
            </section>
            <AdminFormError message={requestError} />
            <AdminFormActions
              isSubmitting={isSubmitting}
              submitLabel="Save customer"
              onCancel={leavePage}
            />
          </AdminForm>
        )}
      </div>
    </AdminTablePageLayout>
  );
};

export default AdminCustomerEditPage;
