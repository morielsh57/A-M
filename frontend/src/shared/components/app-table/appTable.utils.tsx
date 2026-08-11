import React from 'react';
import { Modal } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import AppButton from '../app-button/AppButton';

export type AppTableColumn<T extends object> = NonNullable<TableProps<T>['columns']>[number];

interface BaseColumnConfig<T extends object> {
  key?: string;
  title: React.ReactNode;
  width?: number;
  fixed?: AppTableColumn<T>['fixed'];
  className?: string;
}

interface DataColumnConfig<T extends object, K extends keyof T> extends BaseColumnConfig<T> {
  dataIndex: K;
}

interface RenderColumnConfig<T extends object> extends BaseColumnConfig<T> {
  render: AppTableColumn<T>['render'];
}

interface AppTableActionsConfig<T extends object> {
  record: T;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void | Promise<void>;
  deleteConfirmTitle?: React.ReactNode | ((record: T) => React.ReactNode);
  deleteConfirmContent?: React.ReactNode | ((record: T) => React.ReactNode);
  deleteOkText?: string;
  deleteCancelText?: string;
  isEditDisabled?: boolean;
  isDeleteDisabled?: boolean;
}

interface AppTableActionsColumnConfig<T extends object> {
  fixed?: AppTableColumn<T>['fixed'];
  key?: string;
  title?: React.ReactNode;
  width?: number;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void | Promise<void>;
  deleteConfirmTitle?: React.ReactNode | ((record: T) => React.ReactNode);
  deleteConfirmContent?: React.ReactNode | ((record: T) => React.ReactNode);
  deleteOkText?: string;
  deleteCancelText?: string;
  isEditDisabled?: boolean | ((record: T) => boolean);
  isDeleteDisabled?: boolean | ((record: T) => boolean);
}

const getActionValue = <T extends object, V>(
  value: V | ((record: T) => V) | undefined,
  record: T,
  fallback: V,
) => (typeof value === 'function' ? (value as (record: T) => V)(record) : value) || fallback;

export const formatCurrency = (value: string | number) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return `$${numericValue.toFixed(2)}`;
};

export const formatListValue = (items: string[]) => {
  if (!items.length) {
    return 'None';
  }

  return items.join(', ');
};

export const createTextColumn = <T extends object, K extends keyof T>({
  className,
  dataIndex,
  fixed,
  key,
  title,
  width,
}: DataColumnConfig<T, K>): AppTableColumn<T> => ({
  title,
  dataIndex: dataIndex as string,
  key: key || String(dataIndex),
  fixed,
  width,
  sorter: (a, b) => String(a[dataIndex] || '').localeCompare(String(b[dataIndex] || '')),
  render: (value) => {
    const displayValue = value || 'None';

    return className ? <span className={className}>{displayValue}</span> : displayValue;
  },
});

export const createNumberColumn = <T extends object, K extends keyof T>({
  dataIndex,
  fixed,
  key,
  title,
  width,
}: DataColumnConfig<T, K>): AppTableColumn<T> => ({
  title,
  dataIndex: dataIndex as string,
  key: key || String(dataIndex),
  fixed,
  width,
  sorter: (a, b) => Number(a[dataIndex] || 0) - Number(b[dataIndex] || 0),
});

export const createCurrencyColumn = <T extends object, K extends keyof T>({
  dataIndex,
  fixed,
  key,
  title,
  width,
}: DataColumnConfig<T, K>): AppTableColumn<T> => ({
  title,
  dataIndex: dataIndex as string,
  key: key || String(dataIndex),
  fixed,
  width,
  sorter: (a, b) => Number(a[dataIndex] || 0) - Number(b[dataIndex] || 0),
  render: (value) => formatCurrency(value as string | number),
});

export const createListColumn = <T extends object, K extends keyof T>({
  dataIndex,
  fixed,
  key,
  title,
  width,
}: DataColumnConfig<T, K>): AppTableColumn<T> => ({
  title,
  dataIndex: dataIndex as string,
  key: key || String(dataIndex),
  fixed,
  width,
  render: (items) => (Array.isArray(items) ? formatListValue(items) : 'None'),
});

export const createRenderColumn = <T extends object>({
  fixed,
  key,
  render,
  title,
  width,
}: RenderColumnConfig<T>): AppTableColumn<T> => ({
  title,
  key,
  fixed,
  width,
  render,
});

export const renderAppTableActions = <T extends object>({
  deleteCancelText = 'Cancel',
  deleteConfirmContent = 'This action cannot be undone.',
  deleteConfirmTitle = 'Delete item?',
  deleteOkText = 'Delete',
  isDeleteDisabled = false,
  isEditDisabled = false,
  onDelete,
  onEdit,
  record,
}: AppTableActionsConfig<T>) => {
  const handleDeleteClick = () => {
    if (!onDelete) {
      return;
    }

    Modal.confirm({
      title: getActionValue(deleteConfirmTitle, record, 'Delete item?'),
      content: getActionValue(deleteConfirmContent, record, 'This action cannot be undone.'),
      okText: deleteOkText,
      okButtonProps: { danger: true },
      cancelText: deleteCancelText,
      onOk: () => onDelete(record),
    });
  };

  return (
    <div className="app-table-actions">
      <AppButton
        aria-label="Edit"
        className="app-table-actions__button"
        disabled={!onEdit || isEditDisabled}
        title="Edit"
        variant="secondary"
        onClick={() => onEdit?.(record)}
      >
        <EditOutlined />
      </AppButton>
      <AppButton
        aria-label="Delete"
        className="app-table-actions__button"
        disabled={!onDelete || isDeleteDisabled}
        title="Delete"
        variant="danger"
        onClick={handleDeleteClick}
      >
        <DeleteOutlined />
      </AppButton>
    </div>
  );
};

export const createActionsColumn = <T extends object>({
  deleteCancelText,
  deleteConfirmContent,
  deleteConfirmTitle,
  deleteOkText,
  fixed = 'right',
  isDeleteDisabled,
  isEditDisabled,
  key = 'actions',
  onDelete,
  onEdit,
  title = 'Actions',
  width = 112,
}: AppTableActionsColumnConfig<T>): AppTableColumn<T> => createRenderColumn<T>({
  title,
  key,
  fixed,
  width,
  render: (_, record) => renderAppTableActions({
    record,
    onEdit,
    onDelete,
    deleteConfirmTitle,
    deleteConfirmContent,
    deleteOkText,
    deleteCancelText,
    isEditDisabled: typeof isEditDisabled === 'function' ? isEditDisabled(record) : isEditDisabled,
    isDeleteDisabled: typeof isDeleteDisabled === 'function'
      ? isDeleteDisabled(record)
      : isDeleteDisabled,
  }),
});
