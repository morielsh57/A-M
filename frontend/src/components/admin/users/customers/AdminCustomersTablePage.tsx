import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToast } from '../../../../shared/utils/toast.utils';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AdminTablePageLayout from '../../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AdminFormDrawer from '../../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AppButton from '../../../../shared/components/app-button/AppButton';
import AppSelect from '../../../../shared/components/app-select/AppSelect';
import AppTable from '../../../../shared/components/app-table/AppTable';
import {
  deleteAdminUser,
  getAdminUsers,
  getAdminUsersCacheKey,
} from '../adminUsers.store';
import { EUserRole } from '../../../../shared/store/user/user.types';
import type { IAdminUser, IAdminUsersListRequestParams } from '../adminUsers.types';
import { getAdminUserFormErrorMessage } from '../adminUsers.utils';
import AdminUsersColumnRender from '../AdminUsersColumnRender';
import AdminUsersForm from '../user-form/AdminUsersForm';
import '../AdminUsersTablePage.scss';

const CUSTOMER_ROLE = EUserRole.CUSTOMER;

const getPositivePage = (value: string | null) => {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const AdminCustomersTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingCustomerId, setEditingCustomerId] = React.useState<string>();
  const [editingCustomerName, setEditingCustomerName] = React.useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isCustomerFormDirty, setIsCustomerFormDirty] = React.useState(false);
  const { deleteUserReq, usersByQueryReq } = useAppSelector(
    (store) => store.adminUsersStoreReducer,
  );
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const statusValue = searchParams.get('status') || 'all';

  const requestParams = useMemo<IAdminUsersListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    role: CUSTOMER_ROLE,
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    ...(statusValue === 'active' ? { is_active: true } : {}),
    ...(statusValue === 'inactive' ? { is_active: false } : {}),
  }), [currentPage, searchValue, statusValue]);
  const cacheKey = getAdminUsersCacheKey(requestParams);
  const customersReq = usersByQueryReq[cacheKey];
  const customers = customersReq?.data || [];
  const pagination = customersReq?.meta?.pagination;
  const isLoading = !customersReq || customersReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!customersReq) void dispatch(getAdminUsers(requestParams));
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
    void dispatch(getAdminUsers(requestParams));
  }, [dispatch, requestParams]);

  const openCreateDrawer = useCallback(() => {
    setEditingCustomerId(undefined);
    setEditingCustomerName(undefined);
    setIsCustomerFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((customer: IAdminUser) => {
    const customerId = String(customer.user_id);
    setEditingCustomerId(customerId);
    setEditingCustomerName(customer.name);
    setIsCustomerFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const forceCloseDrawer = useCallback(() => {
    setIsCustomerFormDirty(false);
    setIsDrawerOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!isCustomerFormDirty) {
      forceCloseDrawer();
      return;
    }
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this customer form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseDrawer,
    });
  }, [forceCloseDrawer, isCustomerFormDirty]);

  const handleDelete = useCallback(async (customer: IAdminUser) => {
    try {
      await dispatch(deleteAdminUser({ user_id: customer.user_id })).unwrap();
      addToast('Customer deleted successfully.', { appearance: 'success', autoDismiss: true });
      refetch();
    } catch (error) {
      addToast(
        getAdminUserFormErrorMessage(error, 'The customer request failed. Please try again.'),
        { appearance: 'error', autoDismiss: true },
      );
      throw error;
    }
  }, [addToast, dispatch, refetch]);

  const columns = useMemo(() => AdminUsersColumnRender({
    accountLabel: 'customer',
    isDeletePending: deleteUserReq.status === EAPIStatus.PENDING,
    onDeleteUser: handleDelete,
    onEditUser: openEditDrawer,
  }), [deleteUserReq.status, handleDelete, openEditDrawer]);

  const drawerTitle = editingCustomerId === undefined ? 'Create customer' : (
    <>
      Edit <span className="admin-form-drawer__title-accent">{editingCustomerName || 'customer'}</span>
    </>
  );
  const drawerSubtitle = editingCustomerId === undefined
    ? 'Create a customer account and set its contact information and initial status.'
    : 'Update customer contact information and account status.';

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
          className="admin-users-page__error"
          type="error"
          showIcon
          message="Customers could not be loaded"
          description={getAdminUserFormErrorMessage(
            customersReq.error,
            'The customer request failed. Please try again.',
          )}
          action={<AppButton variant="secondary" onClick={refetch}>Try again</AppButton>}
        />
      )}
      <AppTable<IAdminUser>
        actions={(
          <AppSelect
            className="admin-users-page__status-filter"
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
        isOpen={isDrawerOpen}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={closeDrawer}
      >
        <AdminUsersForm
          role={CUSTOMER_ROLE}
          onCancel={closeDrawer}
          onDirtyChange={setIsCustomerFormDirty}
          onSaved={() => {
            refetch();
            forceCloseDrawer();
          }}
          userId={editingCustomerId}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminCustomersTablePage;
