import React from 'react';
import { Avatar, Tag } from 'antd';
import {
  createActionsColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';
import type { IAdminCustomer } from './adminCustomers.types';

interface CustomersColumnRenderProps {
  accountLabel?: string;
  isDeleteDisabled?: (customer: IAdminCustomer) => boolean;
  isDeletePending: boolean;
  onDeleteCustomer: (customer: IAdminCustomer) => void | Promise<void>;
  onEditCustomer: (customer: IAdminCustomer) => void;
}

const getInitials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || '?';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const CustomersColumnRender = ({
  accountLabel = 'customer',
  isDeletePending,
  isDeleteDisabled,
  onDeleteCustomer,
  onEditCustomer,
}: CustomersColumnRenderProps): AppTableColumn<IAdminCustomer>[] => [
  createRenderColumn<IAdminCustomer>({
    title: 'ID',
    key: 'user_id',
    fixed: 'left',
    width: 74,
    render: (_, customer) => (
      <span className="admin-customers-page__customer-id">#{customer.user_id}</span>
    ),
  }),
  createRenderColumn<IAdminCustomer>({
    title: 'Avatar',
    key: 'avatar',
    width: 90,
    render: (_, customer) => (
      <Avatar className="admin-customers-page__avatar">
        {getInitials(customer.name)}
      </Avatar>
    ),
  }),
  createTextColumn<IAdminCustomer, 'name'>({
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 190,
    className: 'admin-table-page-name',
  }),
  createTextColumn<IAdminCustomer, 'email'>({
    title: 'Email',
    dataIndex: 'email',
    width: 250,
  }),
  createTextColumn<IAdminCustomer, 'phone'>({
    title: 'Phone',
    dataIndex: 'phone',
    width: 160,
  }),
  createTextColumn<IAdminCustomer, 'address'>({
    title: 'Address',
    dataIndex: 'address',
    width: 270,
  }),
  createRenderColumn<IAdminCustomer>({
    title: 'Account status',
    key: 'is_active',
    width: 145,
    render: (_, customer) => (
      <Tag color={customer.is_active ? 'success' : 'default'}>
        {customer.is_active ? 'Active' : 'Inactive'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminCustomer>({
    title: 'Email status',
    key: 'is_valid_email',
    width: 145,
    render: (_, customer) => (
      <Tag color={customer.is_valid_email ? 'success' : 'warning'}>
        {customer.is_valid_email ? 'Verified' : 'Unverified'}
      </Tag>
    ),
  }),
  createRenderColumn<IAdminCustomer>({
    title: 'Joined',
    key: 'date_created',
    width: 130,
    render: (_, customer) => formatDate(customer.date_created),
  }),
  createActionsColumn<IAdminCustomer>({
    onEdit: onEditCustomer,
    onDelete: onDeleteCustomer,
    deleteConfirmTitle: (customer) => `Delete ${customer.name}?`,
    deleteConfirmContent: `This permanently deletes the ${accountLabel} account. Accounts referenced by protected business records may be blocked by the server.`,
    deleteOkText: `Delete ${accountLabel}`,
    isDeleteDisabled: (customer) => isDeletePending || !!isDeleteDisabled?.(customer),
  }),
];

export default CustomersColumnRender;
