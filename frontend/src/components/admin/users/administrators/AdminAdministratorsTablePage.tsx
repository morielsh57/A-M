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

const ADMINISTRATOR_ROLE = EUserRole.ADMIN;

const getPositivePage = (value: string | null) => {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const AdminAdministratorsTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingAdministratorId, setEditingAdministratorId] = React.useState<string>();
  const [editingAdministratorName, setEditingAdministratorName] = React.useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isAdministratorFormDirty, setIsAdministratorFormDirty] = React.useState(false);
  const { deleteUserReq, usersByQueryReq } = useAppSelector(
    (store) => store.adminUsersStoreReducer,
  );
  const currentAdmin = useAppSelector((store) => store.userStoreReducer.adminOrSupplierUser);
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const statusValue = searchParams.get('status') || 'all';

  const requestParams = useMemo<IAdminUsersListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    role: ADMINISTRATOR_ROLE,
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    ...(statusValue === 'active' ? { is_active: true } : {}),
    ...(statusValue === 'inactive' ? { is_active: false } : {}),
  }), [currentPage, searchValue, statusValue]);
  const cacheKey = getAdminUsersCacheKey(requestParams);
  const administratorsReq = usersByQueryReq[cacheKey];
  const administrators = administratorsReq?.data || [];
  const pagination = administratorsReq?.meta?.pagination;
  const isLoading = !administratorsReq || administratorsReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!administratorsReq) void dispatch(getAdminUsers(requestParams));
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
    void dispatch(getAdminUsers(requestParams));
  }, [dispatch, requestParams]);

  const openCreateDrawer = useCallback(() => {
    setEditingAdministratorId(undefined);
    setEditingAdministratorName(undefined);
    setIsAdministratorFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((administrator: IAdminUser) => {
    setEditingAdministratorId(String(administrator.user_id));
    setEditingAdministratorName(administrator.name);
    setIsAdministratorFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const forceCloseDrawer = useCallback(() => {
    setIsAdministratorFormDirty(false);
    setIsDrawerOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!isAdministratorFormDirty) {
      forceCloseDrawer();
      return;
    }

    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this administrator form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseDrawer,
    });
  }, [forceCloseDrawer, isAdministratorFormDirty]);

  const handleDelete = useCallback(async (administrator: IAdminUser) => {
    try {
      await dispatch(deleteAdminUser({ user_id: administrator.user_id })).unwrap();
      addToast('Administrator deleted successfully.', { appearance: 'success', autoDismiss: true });
      refetch();
    } catch (error) {
      addToast(
        getAdminUserFormErrorMessage(error, 'The administrator request failed. Please try again.'),
        { appearance: 'error', autoDismiss: true },
      );
      throw error;
    }
  }, [addToast, dispatch, refetch]);

  const columns = useMemo(() => AdminUsersColumnRender({
    accountLabel: 'administrator',
    isDeletePending: deleteUserReq.status === EAPIStatus.PENDING,
    isDeleteDisabled: (administrator) => (
      String(administrator.user_id) === String(currentAdmin?.user_id)
    ),
    deleteDisabledTooltip: (administrator) => (
      String(administrator.user_id) === String(currentAdmin?.user_id)
        ? "You can't delete your own account."
        : undefined
    ),
    onDeleteUser: handleDelete,
    onEditUser: openEditDrawer,
  }), [currentAdmin?.user_id, deleteUserReq.status, handleDelete, openEditDrawer]);

  const drawerTitle = editingAdministratorId === undefined ? 'Create administrator' : (
    <>
      Edit <span className="admin-form-drawer__title-accent">{editingAdministratorName || 'administrator'}</span>
    </>
  );
  const drawerSubtitle = editingAdministratorId === undefined
    ? 'Create an authorized administrator account and set its initial status.'
    : 'Update administrator contact information and account status.';

  return (
    <AdminTablePageLayout
      createButtonLabel="Create administrator"
      eyebrow="User management"
      title="Administrators"
      subtitle="Review administrator accounts and manage authorized access."
      onCreateClick={openCreateDrawer}
    >
      {administratorsReq?.status === EAPIStatus.REJECTED && (
        <Alert
          className="admin-users-page__error"
          type="error"
          showIcon
          message="Administrators could not be loaded"
          description={getAdminUserFormErrorMessage(
            administratorsReq.error,
            'The administrator request failed. Please try again.',
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
        isOpen={isDrawerOpen}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={closeDrawer}
      >
        <AdminUsersForm
          role={ADMINISTRATOR_ROLE}
          onCancel={closeDrawer}
          onDirtyChange={setIsAdministratorFormDirty}
          onSaved={() => {
            refetch();
            forceCloseDrawer();
          }}
          userId={editingAdministratorId}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminAdministratorsTablePage;
