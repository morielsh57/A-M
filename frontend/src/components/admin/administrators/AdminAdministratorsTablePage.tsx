import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminFormDrawer from '../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppSelect from '../../../shared/components/app-select/AppSelect';
import AppTable from '../../../shared/components/app-table/AppTable';
import AdminCustomerCreateForm from '../customers/AdminCustomerCreateForm';
import CustomersColumnRender from '../customers/CustomersColumnRender';
import {
  deleteAdminCustomer,
  getAdminCustomers,
  getAdminCustomersCacheKey,
} from '../customers/adminCustomers.store';
import type {
  IAdminCustomer,
  IAdminCustomersListRequestParams,
} from '../customers/adminCustomers.types';
import '../customers/AdminCustomersTablePage.scss';

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
  return apiError?.message || 'The administrator request failed. Please try again.';
};

const AdminAdministratorsTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const [searchParams] = useSearchParams();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [isCreateFormDirty, setIsCreateFormDirty] = React.useState(false);
  const { customersByQueryReq, deleteCustomerReq } = useAppSelector(
    (store) => store.adminCustomersStoreReducer,
  );
  const currentAdmin = useAppSelector((store) => store.userStoreReducer.adminOrSupplierUser);
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const statusValue = searchParams.get('status') || 'all';

  const requestParams = useMemo<IAdminCustomersListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    role: 'Admin',
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    ...(statusValue === 'active' ? { is_active: true } : {}),
    ...(statusValue === 'inactive' ? { is_active: false } : {}),
  }), [currentPage, searchValue, statusValue]);
  const cacheKey = getAdminCustomersCacheKey(requestParams);
  const administratorsReq = customersByQueryReq[cacheKey];
  const administrators = administratorsReq?.data || [];
  const pagination = administratorsReq?.meta?.pagination;
  const isLoading = !administratorsReq || administratorsReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!administratorsReq) void dispatch(getAdminCustomers(requestParams));
  }, [administratorsReq, dispatch, requestParams]);

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
    navigate(`${APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.ADMINS)}?${params}`);
  };

  const refetch = useCallback(() => {
    void dispatch(getAdminCustomers(requestParams));
  }, [dispatch, requestParams]);

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
      content: 'You changed this administrator form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseCreateDrawer,
    });
  }, [forceCloseCreateDrawer, isCreateFormDirty]);

  const handleDelete = useCallback(async (administrator: IAdminCustomer) => {
    try {
      await dispatch(deleteAdminCustomer({ user_id: administrator.user_id })).unwrap();
      addToast('Administrator deleted successfully.', { appearance: 'success', autoDismiss: true });
      refetch();
    } catch (error) {
      addToast(getErrorMessage(error), { appearance: 'error', autoDismiss: true });
      throw error;
    }
  }, [addToast, dispatch, refetch]);

  const columns = useMemo(() => CustomersColumnRender({
    accountLabel: 'administrator',
    isDeletePending: deleteCustomerReq.status === EAPIStatus.PENDING,
    isDeleteDisabled: (administrator) => (
      String(administrator.user_id) === String(currentAdmin?.user_id)
    ),
    deleteDisabledTooltip: (administrator) => (
      String(administrator.user_id) === String(currentAdmin?.user_id)
        ? "You can't delete your own account."
        : undefined
    ),
    onDeleteCustomer: handleDelete,
    onEditCustomer: (administrator) => navigate(
      APP_ROUTING_PATHS.ADMIN_ADMINISTRATOR_EDIT_PAGE(administrator.user_id),
    ),
  }), [currentAdmin?.user_id, deleteCustomerReq.status, handleDelete, navigate]);

  return (
    <AdminTablePageLayout
      createButtonLabel="Add administrator"
      eyebrow="User management"
      title="Administrators"
      subtitle="Review administrator accounts and manage authorized access."
      onCreateClick={() => {
        setIsCreateFormDirty(false);
        setIsCreateDrawerOpen(true);
      }}
    >
      {administratorsReq?.status === EAPIStatus.REJECTED && (
        <Alert
          className="admin-customers-page__error"
          type="error"
          showIcon
          message="Administrators could not be loaded"
          description={getErrorMessage(administratorsReq.error)}
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
        data={administrators}
        emptyText="No administrators found."
        loading={isLoading}
        pagination={{
          current: pagination?.page || currentPage,
          pageSize: pagination?.page_size || ADMIN_TABLE_PAGE_SIZE,
          total: pagination?.total_items || administrators.length,
          showSizeChanger: false,
          onChange: (page) => updateUrlParams({ page }),
        }}
        rowKey="user_id"
        scroll={{ x: 1570 }}
        searchPlaceholder="Search administrators by name or email..."
        searchValue={searchValue}
        subtitle="Search and filters are applied across all administrator accounts."
        title="Administrator accounts"
        onSearchChange={(search) => updateUrlParams({ search })}
      />
      <AdminFormDrawer
        isOpen={isCreateDrawerOpen}
        title="Add administrator"
        subtitle="Create an authorized administrator account and set its initial status."
        onClose={closeCreateDrawer}
      >
        <AdminCustomerCreateForm
          accountLabel="administrator"
          accountRole="Admin"
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

export default AdminAdministratorsTablePage;
