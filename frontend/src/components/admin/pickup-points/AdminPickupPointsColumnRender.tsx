import React from 'react';
import { Tag } from 'antd';
import {
  createActionsColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';
import type { IAdminPickupPoint } from './adminPickupPoints.types';
import { formatAdminPickupPointDate } from './adminPickupPoints.utils';

interface AdminPickupPointsColumnRenderProps {
  isDeletePending: boolean;
  onDeletePickupPoint: (pickupPoint: IAdminPickupPoint) => void | Promise<void>;
  onEditPickupPoint: (pickupPoint: IAdminPickupPoint) => void;
}

const AdminPickupPointsColumnRender = ({
  isDeletePending,
  onDeletePickupPoint,
  onEditPickupPoint,
}: AdminPickupPointsColumnRenderProps): AppTableColumn<IAdminPickupPoint>[] => [
  createRenderColumn<IAdminPickupPoint>({
    title: 'ID',
    key: 'pick_up_point_id',
    fixed: 'left',
    width: 90,
    render: (_, pickupPoint) => (
      <span className="admin-pickup-points-page__id">
        #{pickupPoint.pick_up_point_id}
      </span>
    ),
  }),
  createTextColumn<IAdminPickupPoint, 'name'>({
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 220,
    className: 'admin-table-page-name',
  }),
  createTextColumn<IAdminPickupPoint, 'address'>({
    title: 'Address',
    dataIndex: 'address',
    width: 300,
  }),
  createTextColumn<IAdminPickupPoint, 'description'>({
    title: 'Description',
    dataIndex: 'description',
    width: 280,
  }),
  createRenderColumn<IAdminPickupPoint>({
    title: 'Latitude',
    key: 'lat',
    width: 140,
    render: (_, pickupPoint) => (
      <span className="admin-pickup-points-page__coordinate">{pickupPoint.lat}</span>
    ),
  }),
  createRenderColumn<IAdminPickupPoint>({
    title: 'Longitude',
    key: 'lng',
    width: 140,
    render: (_, pickupPoint) => (
      <span className="admin-pickup-points-page__coordinate">{pickupPoint.lng}</span>
    ),
  }),
  createRenderColumn<IAdminPickupPoint>({
    title: 'Status',
    key: 'is_active',
    width: 120,
    render: (_, pickupPoint) => (
      <Tag color={pickupPoint.is_active ? 'success' : 'default'}>
        {pickupPoint.is_active ? 'Active' : 'Inactive'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminPickupPoint>({
    title: 'Created',
    key: 'date_created',
    width: 130,
    render: (_, pickupPoint) => formatAdminPickupPointDate(pickupPoint.date_created),
  }),
  createActionsColumn<IAdminPickupPoint>({
    onEdit: onEditPickupPoint,
    onDelete: onDeletePickupPoint,
    deleteConfirmTitle: (pickupPoint) => `Delete ${pickupPoint.name}?`,
    deleteConfirmContent: 'This permanently deletes the pickup point. Pickup points referenced by protected business records may be blocked by the server.',
    deleteOkText: 'Delete pickup point',
    isDeleteDisabled: isDeletePending,
  }),
];

export default AdminPickupPointsColumnRender;
