import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addToast } from '../../../shared/utils/toast.utils';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../app/constants';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AdminFormDrawer from '../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppTable from '../../../shared/components/app-table/AppTable';
import AdminPickupPointsColumnRender from './AdminPickupPointsColumnRender';
import {
  deleteAdminPickupPoint,
  getAdminPickupPoints,
  getAdminPickupPointsCacheKey,
} from './adminPickupPoints.store';
import type {
  IAdminPickupPoint,
  IAdminPickupPointsListRequestParams,
} from './adminPickupPoints.types';
import { getAdminPickupPointErrorMessage } from './adminPickupPoints.utils';
import AdminPickupPointForm from './pickup-point-form/AdminPickupPointForm';
import './AdminPickupPointsTablePage.scss';

const getPositivePage = (value: string | null) => {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const AdminPickupPointsTablePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingPickupPointId, setEditingPickupPointId] = React.useState<number>();
  const [editingPickupPointName, setEditingPickupPointName] = React.useState<string>();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isPickupPointFormDirty, setIsPickupPointFormDirty] = React.useState(false);
  const { deletePickupPointReq, pickupPointsByQueryReq } = useAppSelector(
    (store) => store.adminPickupPointsStoreReducer,
  );
  const currentPage = getPositivePage(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';

  const requestParams = useMemo<IAdminPickupPointsListRequestParams>(() => ({
    page: currentPage,
    page_size: ADMIN_TABLE_PAGE_SIZE,
    ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
  }), [currentPage, searchValue]);
  const cacheKey = getAdminPickupPointsCacheKey(requestParams);
  const pickupPointsReq = pickupPointsByQueryReq[cacheKey];
  const pickupPoints = pickupPointsReq?.data || [];
  const pagination = pickupPointsReq?.meta?.pagination;
  const isLoading = !pickupPointsReq || pickupPointsReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!pickupPointsReq) {
      void dispatch(getAdminPickupPoints(requestParams));
    }
  }, [dispatch, pickupPointsReq, requestParams]);

  const updateUrlParams = (updates: { page?: number; search?: string }) => {
    const params = new URLSearchParams(searchParams);

    if (updates.page !== undefined) {
      params.set('page', String(updates.page));
    }

    if (updates.search !== undefined) {
      const search = updates.search.trim();
      search ? params.set('search', search) : params.delete('search');
      params.set('page', '1');
    }

    navigate(`${APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.PICKUP_POINTS)}?${params}`);
  };

  const refetch = useCallback(() => {
    void dispatch(getAdminPickupPoints(requestParams));
  }, [dispatch, requestParams]);

  const openCreateDrawer = useCallback(() => {
    setEditingPickupPointId(undefined);
    setEditingPickupPointName(undefined);
    setIsPickupPointFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((pickupPoint: IAdminPickupPoint) => {
    setEditingPickupPointId(pickupPoint.pick_up_point_id);
    setEditingPickupPointName(pickupPoint.name);
    setIsPickupPointFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const forceCloseDrawer = useCallback(() => {
    setIsPickupPointFormDirty(false);
    setIsDrawerOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!isPickupPointFormDirty) {
      forceCloseDrawer();
      return;
    }

    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this pickup point form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseDrawer,
    });
  }, [forceCloseDrawer, isPickupPointFormDirty]);

  const handleDelete = useCallback(async (pickupPoint: IAdminPickupPoint) => {
    try {
      await dispatch(deleteAdminPickupPoint({
        pick_up_point_id: pickupPoint.pick_up_point_id,
      })).unwrap();
      addToast('Pickup point deleted successfully.', {
        appearance: 'success',
        autoDismiss: true,
      });
      refetch();
    } catch (error) {
      addToast(
        getAdminPickupPointErrorMessage(error, 'Pickup point could not be deleted. Please try again.'),
        { appearance: 'error', autoDismiss: true },
      );
      throw error;
    }
  }, [addToast, dispatch, refetch]);

  const columns = useMemo(() => AdminPickupPointsColumnRender({
    isDeletePending: deletePickupPointReq.status === EAPIStatus.PENDING,
    onDeletePickupPoint: handleDelete,
    onEditPickupPoint: openEditDrawer,
  }), [deletePickupPointReq.status, handleDelete, openEditDrawer]);

  const drawerTitle = editingPickupPointId === undefined ? 'Create pickup point' : (
    <>
      Edit <span className="admin-form-drawer__title-accent">{editingPickupPointName || 'pickup point'}</span>
    </>
  );
  const drawerSubtitle = editingPickupPointId === undefined
    ? 'Create a pickup point and set its map location and active status.'
    : 'Update pickup point details, coordinates, and availability.';

  return (
    <AdminTablePageLayout
      createButtonLabel="Create pickup point"
      eyebrow="Pickup management"
      title="Pickup points"
      subtitle="Manage the pickup locations customers can choose during checkout."
      onCreateClick={openCreateDrawer}
    >
      {pickupPointsReq?.status === EAPIStatus.REJECTED && (
        <Alert
          className="admin-pickup-points-page__error"
          type="error"
          showIcon
          message="Pickup points could not be loaded"
          description={getAdminPickupPointErrorMessage(
            pickupPointsReq.error,
            'The pickup points request failed. Please try again.',
          )}
          action={<AppButton variant="secondary" onClick={refetch}>Try again</AppButton>}
        />
      )}

      <AppTable<IAdminPickupPoint>
        columns={columns}
        data={pickupPoints}
        emptyText="No pickup points found."
        loading={isLoading}
        pagination={{
          current: pagination?.page || currentPage,
          pageSize: pagination?.page_size || ADMIN_TABLE_PAGE_SIZE,
          total: pagination?.total_items || pickupPoints.length,
          showSizeChanger: false,
          onChange: (page) => updateUrlParams({ page }),
        }}
        rowKey="pick_up_point_id"
        scroll={{ x: 1510 }}
        searchPlaceholder="Search pickup points by name, address, description, or ID..."
        searchValue={searchValue}
        subtitle="Search is applied across all pickup points."
        title="Pickup locations"
        onSearchChange={(search) => updateUrlParams({ search })}
      />

      <AdminFormDrawer
        isOpen={isDrawerOpen}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        onClose={closeDrawer}
      >
        <AdminPickupPointForm
          pickupPointId={editingPickupPointId}
          onCancel={closeDrawer}
          onDirtyChange={setIsPickupPointFormDirty}
          onSaved={() => {
            refetch();
            forceCloseDrawer();
          }}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminPickupPointsTablePage;
