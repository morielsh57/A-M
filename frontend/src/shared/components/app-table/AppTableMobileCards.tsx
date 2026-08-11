import React from 'react';
import { Empty, Spin } from 'antd';
import type { TableProps } from 'antd';
import './AppTableMobileCards.scss';

type AppTableMobileColumn<T extends object> = NonNullable<TableProps<T>['columns']>[number] & {
  dataIndex?: keyof T | string | number | readonly (string | number)[];
  hidden?: boolean;
  key?: React.Key;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  title?: React.ReactNode;
};

interface AppTableMobileCardsProps<T extends object> {
  columns?: TableProps<T>['columns'];
  data: T[];
  emptyText: string;
  loading?: TableProps<T>['loading'];
  rowKey?: TableProps<T>['rowKey'];
}

const getColumnLabel = <T extends object>(column: AppTableMobileColumn<T>) => (
  typeof column.title === 'string' || typeof column.title === 'number'
    ? column.title
    : String(column.key || '')
);

const getColumnValue = <T extends object>(
  column: AppTableMobileColumn<T>,
  record: T,
) => {
  const dataIndex = column.dataIndex;

  if (Array.isArray(dataIndex)) {
    return (dataIndex as readonly (string | number)[]).reduce<unknown>((value, key) => {
      if (value && typeof value === 'object') {
        return (value as Record<string | number, unknown>)[key];
      }

      return undefined;
    }, record);
  }

  if (dataIndex === undefined) {
    return undefined;
  }

  return (record as Record<string | number, unknown>)[dataIndex as string | number];
};

const renderColumnValue = <T extends object>(
  column: AppTableMobileColumn<T>,
  record: T,
  index: number,
) => {
  const value = getColumnValue(column, record);
  const renderedValue = column.render ? column.render(value, record, index) : value;

  if (renderedValue === null || renderedValue === undefined || renderedValue === '') {
    return 'None';
  }

  if (Array.isArray(renderedValue)) {
    return renderedValue.join(', ');
  }

  if (React.isValidElement(renderedValue)) {
    return renderedValue;
  }

  return String(renderedValue);
};

const getVisibleColumns = <T extends object>(columns?: TableProps<T>['columns']) => (
  (columns || [])
    .filter((column) => !(column as AppTableMobileColumn<T>).hidden)
    .filter((column) => !('children' in column)) as AppTableMobileColumn<T>[]
);

const AppTableMobileCards = <T extends object>({
  columns,
  data,
  emptyText,
  loading,
  rowKey,
}: AppTableMobileCardsProps<T>) => {
  const visibleColumns = getVisibleColumns(columns);
  const titleColumn = visibleColumns[0];
  const actionsColumn = visibleColumns.find((column) => column.key === 'actions');
  const bodyColumns = visibleColumns.filter((column) => (
    column !== titleColumn && column !== actionsColumn
  ));
  const isLoading = Boolean(loading) && (
    typeof loading !== 'object' || loading.spinning !== false
  );

  const getRecordKey = (record: T, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(record, index);
    }

    if (typeof rowKey === 'string') {
      return (record as Record<string, React.Key>)[rowKey];
    }

    return index;
  };

  return (
    <div className="app-table-mobile-cards">
      {isLoading && (
        <div className="app-table-mobile-cards__loading">
          <Spin />
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <Empty description={emptyText} />
      )}

      {!isLoading && data.map((record, index) => (
        <article className="app-table-mobile-cards__card" key={getRecordKey(record, index)}>
          <div className="app-table-mobile-cards__card-header">
            <h3 className="app-table-mobile-cards__card-title">
              {titleColumn ? renderColumnValue(titleColumn, record, index) : `Item ${index + 1}`}
            </h3>

            {actionsColumn && (
              <div className="app-table-mobile-cards__card-actions">
                {renderColumnValue(actionsColumn, record, index)}
              </div>
            )}
          </div>

          <div className="app-table-mobile-cards__card-body">
            {bodyColumns.map((column) => (
              <div
                className="app-table-mobile-cards__card-row"
                key={String(column.key || column.dataIndex)}
              >
                <span className="app-table-mobile-cards__card-label">
                  {getColumnLabel(column)}
                </span>
                <span className="app-table-mobile-cards__card-value">
                  {renderColumnValue(column, record, index)}
                </span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
};

export default AppTableMobileCards;
