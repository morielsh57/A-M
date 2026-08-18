import React from 'react';
import { Avatar, Tag } from 'antd';
import {
  createActionsColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../../shared/components/app-table/appTable.utils';
import type { IAdminUser } from '../adminUsers.types';
import { formatAdminUserDate, getAdminUserInitials } from '../adminUsers.utils';

interface CustomersColumnRenderProps {
  isDeletePending: boolean;
  onDeleteCustomer: (customer: IAdminUser) => void | Promise<void>;
  onEditCustomer: (customer: IAdminUser) => void;
}

const CustomersColumnRender = ({
  isDeletePending,
  onDeleteCustomer,
  onEditCustomer,
}: CustomersColumnRenderProps): AppTableColumn<IAdminUser>[] => [
  createRenderColumn<IAdminUser>({
    title: 'ID',
    key: 'user_id',
    fixed: 'left',
    width: 74,
    render: (_, customer) => (
      <span className="admin-customers-page__customer-id">#{customer.user_id}</span>
    ),
  }),
  createRenderColumn<IAdminUser>({
    title: 'Avatar',
    key: 'avatar',
    width: 90,
    render: (_, customer) => (
      <Avatar className="admin-customers-page__avatar">
        {getAdminUserInitials(customer.name)}
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
    render: (_, customer) => (
      <Tag color={customer.is_active ? 'success' : 'default'}>
        {customer.is_active ? 'Active' : 'Inactive'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminUser>({
    title: 'Email status',
    key: 'is_valid_email',
    width: 145,
    render: (_, customer) => (
      <Tag color={customer.is_valid_email ? 'success' : 'warning'}>
        {customer.is_valid_email ? 'Verified' : 'Unverified'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminUser>({
    title: 'Joined',
    key: 'date_created',
    width: 130,
    render: (_, customer) => formatAdminUserDate(customer.date_created),
  }),
  createActionsColumn<IAdminUser>({
    onEdit: onEditCustomer,
    onDelete: onDeleteCustomer,
    deleteConfirmTitle: (customer) => `Delete ${customer.name}?`,
    deleteConfirmContent: 'This permanently deletes the customer account. Accounts referenced by protected business records may be blocked by the server.',
    deleteOkText: 'Delete customer',
    isDeleteDisabled: isDeletePending,
  }),
];

export default CustomersColumnRender;
