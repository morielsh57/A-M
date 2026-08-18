import React from 'react';
import { Avatar, Tag } from 'antd';
import {
  createActionsColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';
import type { IAdminUser } from './adminUsers.types';
import { formatAdminUserDate, getAdminUserInitials } from './adminUsers.utils';

interface AdminUsersColumnRenderProps {
  accountLabel: string;
  isDeletePending: boolean;
  isDeleteDisabled?: (user: IAdminUser) => boolean;
  onDeleteUser: (user: IAdminUser) => void | Promise<void>;
  onEditUser: (user: IAdminUser) => void;
}

const AdminUsersColumnRender = ({
  accountLabel,
  isDeleteDisabled,
  isDeletePending,
  onDeleteUser,
  onEditUser,
}: AdminUsersColumnRenderProps): AppTableColumn<IAdminUser>[] => [
  createRenderColumn<IAdminUser>({
    title: 'ID',
    key: 'user_id',
    fixed: 'left',
    width: 74,
    render: (_, user) => (
      <span className="admin-users-page__user-id">#{user.user_id}</span>
    ),
  }),
  createRenderColumn<IAdminUser>({
    title: 'Avatar',
    key: 'avatar',
    width: 90,
    render: (_, user) => (
      <Avatar className="admin-users-page__avatar">
        {getAdminUserInitials(user.name)}
      </Avatar>
    ),
  }),
  createTextColumn<IAdminUser, 'name'>({
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 190,
    className: 'admin-table-page-name',
  }),
  createTextColumn<IAdminUser, 'email'>({
    title: 'Email',
    dataIndex: 'email',
    width: 250,
  }),
  createTextColumn<IAdminUser, 'phone'>({
    title: 'Phone',
    dataIndex: 'phone',
    width: 160,
  }),
  createTextColumn<IAdminUser, 'address'>({
    title: 'Address',
    dataIndex: 'address',
    width: 270,
  }),
  createRenderColumn<IAdminUser>({
    title: 'Account status',
    key: 'is_active',
    width: 145,
    render: (_, user) => (
      <Tag color={user.is_active ? 'success' : 'default'}>
        {user.is_active ? 'Active' : 'Inactive'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminUser>({
    title: 'Email status',
    key: 'is_valid_email',
    width: 145,
    render: (_, user) => (
      <Tag color={user.is_valid_email ? 'success' : 'warning'}>
        {user.is_valid_email ? 'Verified' : 'Unverified'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminUser>({
    title: 'Joined',
    key: 'date_created',
    width: 130,
    render: (_, user) => formatAdminUserDate(user.date_created),
  }),
  createActionsColumn<IAdminUser>({
    onEdit: onEditUser,
    onDelete: onDeleteUser,
    deleteConfirmTitle: (user) => `Delete ${user.name}?`,
    deleteConfirmContent: `This permanently deletes the ${accountLabel} account. Accounts referenced by protected business records may be blocked by the server.`,
    deleteOkText: `Delete ${accountLabel}`,
    isDeleteDisabled: (user) => isDeletePending || Boolean(isDeleteDisabled?.(user)),
  }),
];

export default AdminUsersColumnRender;
