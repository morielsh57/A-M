import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AdminFormDrawer from '../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppSelect from '../../../shared/components/app-select/AppSelect';
import AppTable from '../../../shared/components/app-table/AppTable';
import {
  deleteAdminCustomer,
  getAdminCustomers,
  getAdminCustomersCacheKey,
} from './adminCustomers.store';
import type { IAdminCustomer, IAdminCustomersListRequestParams } from './adminCustomers.types';
import CustomersColumnRender from './CustomersColumnRender';
import AdminCustomerCreateForm from './AdminCustomerCreateForm';
import './AdminCustomersTablePage.scss';

const getPositivePage = (value: string | null) => {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const getErrorMessage = (error: unknown) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;
  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>).flat();
    if (messages.length) return messages.join(' ');
  }
  return apiError?.message || 'The customer request failed. Please try again.';
};

const AdminCustomersTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [searchParams] = useSearchParams();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [isCreateFormDirty, setIsCreateFormDirty] = React.useState(false);
  const { customersByQueryReq, deleteCustomerReq } = useAppSelector(
    (store) => store.adminCustomersStoreReducer,
  );
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const statusValue = searchParams.get('status') || 'all';

  const requestParams = useMemo<IAdminCustomersListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    role: 'Customer',
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    ...(statusValue === 'active' ? { is_active: true } : {}),
    ...(statusValue === 'inactive' ? { is_active: false } : {}),
  }), [currentPage, searchValue, statusValue]);
  const cacheKey = getAdminCustomersCacheKey(requestParams);
  const customersReq = customersByQueryReq[cacheKey];
  const customers = customersReq?.data || [];
  const pagination = customersReq?.meta?.pagination;
  const isLoading = !customersReq || customersReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!customersReq) void dispatch(getAdminCustomers(requestParams));
  }, [customersReq, dispatch, requestParams]);

  const updateUrlParams = (updates: { page?: number; search?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (updates.page !== undefined) params.set('page', String(updates.page));
    if (updates.search !== undefined) {
      updates.search.trim() ? params.set('search', updates.search) : params.delete('search');
      params.set('page', '1');
    }
    if (updates.status !== undefined) {
      updates.status === 'all' ? params.delete('status') : params.set('status', updates.status);
      params.set('page', '1');
    }
    navigate(`${APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.CUSTOMERS)}?${params}`);
  };

  const refetch = useCallback(() => {
    void dispatch(getAdminCustomers(requestParams));
  }, [dispatch, requestParams]);

  const openCreateDrawer = useCallback(() => {
    setIsCreateFormDirty(false);
    setIsCreateDrawerOpen(true);
  }, []);

  const forceCloseCreateDrawer = useCallback(() => {
    setIsCreateFormDirty(false);
    setIsCreateDrawerOpen(false);
  }, []);

  const closeCreateDrawer = useCallback(() => {
    if (!isCreateFormDirty) {
      forceCloseCreateDrawer();
      return;
    }
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this customer form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseCreateDrawer,
    });
  }, [forceCloseCreateDrawer, isCreateFormDirty]);

  const handleDelete = useCallback(async (customer: IAdminCustomer) => {
    try {
      await dispatch(deleteAdminCustomer({ user_id: customer.user_id })).unwrap();
      addToast('Customer deleted successfully.', { appearance: 'success', autoDismiss: true });
      refetch();
    } catch (error) {
      addToast(getErrorMessage(error), { appearance: 'error', autoDismiss: true });
      throw error;
    }
  }, [addToast, dispatch, refetch]);

  const columns = useMemo(() => CustomersColumnRender({
    isDeletePending: deleteCustomerReq.status === EAPIStatus.PENDING,
    onDeleteCustomer: handleDelete,
    onEditCustomer: (customer) => navigate(
      APP_ROUTING_PATHS.ADMIN_CUSTOMER_EDIT_PAGE(customer.user_id),
    ),
  }), [deleteCustomerReq.status, handleDelete, navigate]);

  return (
    <AdminTablePageLayout
      createButtonLabel="Create customer"
      eyebrow="User management"
      title="Customers"
      subtitle="Review customer accounts, contact information, verification, and account status."
      onCreateClick={openCreateDrawer}
    >
      {customersReq?.status === EAPIStatus.REJECTED && (
        <Alert
          className="admin-customers-page__error"
          type="error"
          showIcon
          message="Customers could not be loaded"
          description={getErrorMessage(customersReq.error)}
          action={<AppButton variant="secondary" onClick={refetch}>Try again</AppButton>}
        />
      )}
      <AppTable<IAdminCustomer>
        actions={(
          <AppSelect
            className="admin-customers-page__status-filter"
            value={statusValue}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            onChange={(value) => updateUrlParams({ status: String(value) })}
          />
        )}
        columns={columns}
        data={customers}
        emptyText="No customers found."
        loading={isLoading}
        pagination={{
          current: pagination?.page || currentPage,
          pageSize: pagination?.page_size || ADMIN_TABLE_PAGE_SIZE,
          total: pagination?.total_items || customers.length,
          showSizeChanger: false,
          onChange: (page) => updateUrlParams({ page }),
        }}
        rowKey="user_id"
        scroll={{ x: 1570 }}
        searchPlaceholder="Search customers by name or email..."
        searchValue={searchValue}
        subtitle="Search and filters are applied across all customer accounts."
        title="Customer accounts"
        onSearchChange={(search) => updateUrlParams({ search })}
      />
      <AdminFormDrawer
        isOpen={isCreateDrawerOpen}
        title="Create customer"
        subtitle="Create a customer account and set its contact information and initial status."
        onClose={closeCreateDrawer}
      >
        <AdminCustomerCreateForm
          onCancel={closeCreateDrawer}
          onDirtyChange={setIsCreateFormDirty}
          onSaved={() => {
            refetch();
            forceCloseCreateDrawer();
          }}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminCustomersTablePage;
