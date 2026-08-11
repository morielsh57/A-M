import React from 'react';
import { Input, Pagination, Table } from 'antd';
import type { TableProps } from 'antd';
import AppTableMobileCards from './AppTableMobileCards';
import './AppTable.scss';

export interface AppTableProps<T extends object> extends Omit<TableProps<T>, 'dataSource' | 'title'> {
  actions?: React.ReactNode;
  data: T[];
  emptyText?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  subtitle?: React.ReactNode;
  title?: React.ReactNode;
  onSearchChange?: (value: string) => void;
}

const AppTable = <T extends object>({
  actions,
  className = '',
  data,
  emptyText = 'No data found.',
  loading,
  pagination = undefined,
  searchPlaceholder = 'Search...',
  searchValue,
  subtitle,
  title,
  onSearchChange,
  columns,
  rowKey,
  ...tableProps
}: AppTableProps<T>) => {

  return (
    <section className="app-table">
      {(title || subtitle || actions || onSearchChange) && (
        <div className="app-table__toolbar">
          <div className="app-table__heading">
            {title && <h2 className="app-table__title">{title}</h2>}
            {subtitle && <p className="app-table__subtitle">{subtitle}</p>}
          </div>

          <div className="app-table__controls">
            {onSearchChange && (
              <Input.Search
                allowClear
                className="app-table__search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            )}
            {actions}
          </div>
        </div>
      )}

      <Table<T>
        {...tableProps}
        className={['app-table__table', className].filter(Boolean).join(' ')}
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText, ...tableProps.locale }}
        pagination={false}
        rowKey={rowKey}
      />

      <AppTableMobileCards<T>
        columns={columns}
        data={data}
        emptyText={emptyText}
        loading={loading}
        rowKey={rowKey}
      />

      {!!pagination && (
        <div className="app-table__pagination">
          <Pagination {...pagination} />
        </div>
      )}
    </section>
  );
};

export default AppTable;
