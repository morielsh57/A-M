import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToast } from '../../../../shared/utils/toast.utils';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AdminFormDrawer from '../../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AdminTablePageLayout from '../../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../../shared/components/app-button/AppButton';
import AppSelect from '../../../../shared/components/app-select/AppSelect';
import AppTable from '../../../../shared/components/app-table/AppTable';
import { EUserRole } from '../../../../shared/store/user/user.types';
import AdminUsersColumnRender from '../AdminUsersColumnRender';
import {
  deleteAdminUser,
  getAdminUsers,
  getAdminUsersCacheKey,
} from '../adminUsers.store';
import type { IAdminUser, IAdminUsersListRequestParams } from '../adminUsers.types';
import { getAdminUserFormErrorMessage } from '../adminUsers.utils';
import AdminUsersForm from '../user-form/AdminUsersForm';
import '../AdminUsersTablePage.scss';

const SUPPLIER_ROLE = EUserRole.SUPPLIER;

const getPositivePage = (value: string | null) => {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const AdminSuppliersTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingSupplierId, setEditingSupplierId] = React.useState<string>();
  const [editingSupplierName, setEditingSupplierName] = React.useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isSupplierFormDirty, setIsSupplierFormDirty] = React.useState(false);
  const { deleteUserReq, usersByQueryReq } = useAppSelector(
    (store) => store.adminUsersStoreReducer,
  );
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const statusValue = searchParams.get('status') || 'all';

  const requestParams = useMemo<IAdminUsersListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    role: SUPPLIER_ROLE,
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    ...(statusValue === 'active' ? { is_active: true } : {}),
    ...(statusValue === 'inactive' ? { is_active: false } : {}),
  }), [currentPage, searchValue, statusValue]);
  const cacheKey = getAdminUsersCacheKey(requestParams);
  const suppliersReq = usersByQueryReq[cacheKey];
  const suppliers = suppliersReq?.data || [];
  const pagination = suppliersReq?.meta?.pagination;
  const isLoading = !suppliersReq || suppliersReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!suppliersReq) void dispatch(getAdminUsers(requestParams));
  }, [dispatch, requestParams, suppliersReq]);

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
    navigate(`${APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.SUPPLIERS)}?${params}`);
  };

  const refetch = useCallback(() => {
    void dispatch(getAdminUsers(requestParams));
  }, [dispatch, requestParams]);

  const openCreateDrawer = useCallback(() => {
    setEditingSupplierId(undefined);
    setEditingSupplierName(undefined);
    setIsSupplierFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((supplier: IAdminUser) => {
    setEditingSupplierId(String(supplier.user_id));
    setEditingSupplierName(supplier.name);
    setIsSupplierFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const forceCloseDrawer = useCallback(() => {
    setIsSupplierFormDirty(false);
    setIsDrawerOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!isSupplierFormDirty) {
      forceCloseDrawer();
      return;
    }

    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this supplier form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseDrawer,
    });
  }, [forceCloseDrawer, isSupplierFormDirty]);

  const handleDelete = useCallback(async (supplier: IAdminUser) => {
    try {
      await dispatch(deleteAdminUser({ user_id: supplier.user_id })).unwrap();
      addToast('Supplier deleted successfully.', { appearance: 'success', autoDismiss: true });
      refetch();
    } catch (error) {
      addToast(
        getAdminUserFormErrorMessage(error, 'The supplier request failed. Please try again.'),
        { appearance: 'error', autoDismiss: true },
      );
      throw error;
    }
  }, [addToast, dispatch, refetch]);

  const columns = useMemo(() => AdminUsersColumnRender({
    accountLabel: 'supplier',
    isDeletePending: deleteUserReq.status === EAPIStatus.PENDING,
    onDeleteUser: handleDelete,
    onEditUser: openEditDrawer,
  }), [deleteUserReq.status, handleDelete, openEditDrawer]);

  const drawerTitle = editingSupplierId === undefined ? 'Create supplier' : (
    <>
      Edit <span className="admin-form-drawer__title-accent">{editingSupplierName || 'supplier'}</span>
    </>
  );
  const drawerSubtitle = editingSupplierId === undefined
    ? 'Create a supplier account and set its contact information and initial status.'
    : 'Update supplier contact information and account status.';

  return (
    <AdminTablePageLayout
      createButtonLabel="Create supplier"
      eyebrow="User management"
      title="Suppliers"
      subtitle="Review supplier accounts and manage authorized supplier access."
      onCreateClick={openCreateDrawer}
    >
      {suppliersReq?.status === EAPIStatus.REJECTED && (
        <Alert
          className="admin-users-page__error"
          type="error"
          showIcon
          message="Suppliers could not be loaded"
          description={getAdminUserFormErrorMessage(
            suppliersReq.error,
            'The supplier request failed. Please try again.',
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
        data={suppliers}
        emptyText="No suppliers found."
        loading={isLoading}
        pagination={{
          current: pagination?.page || currentPage,
          pageSize: pagination?.page_size || ADMIN_TABLE_PAGE_SIZE,
          total: pagination?.total_items || suppliers.length,
          showSizeChanger: false,
          onChange: (page) => updateUrlParams({ page }),
        }}
        rowKey="user_id"
        scroll={{ x: 1570 }}
        searchPlaceholder="Search suppliers by name or email..."
        searchValue={searchValue}
        subtitle="Search and filters are applied across all supplier accounts."
        title="Supplier accounts"
        onSearchChange={(search) => updateUrlParams({ search })}
      />
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={closeDrawer}
      >
        <AdminUsersForm
          role={SUPPLIER_ROLE}
          onCancel={closeDrawer}
          onDirtyChange={setIsSupplierFormDirty}
          onSaved={() => {
            refetch();
            forceCloseDrawer();
          }}
          userId={editingSupplierId}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminSuppliersTablePage;
