import React from 'react';
import {
  createActionsColumn,
  createNumberColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';
import type { CategoryId } from '../../../shared/store/category/category.types';

export interface IAdminCategoryTableItem {
  category_id: CategoryId;
  name: string;
  type: 'Main' | 'Sub';
  parent_category: string;
  short_id: string;
  subcategories_count: number | null;
}

const CategoriesColumnRender = (): AppTableColumn<IAdminCategoryTableItem>[] => [
  createRenderColumn<IAdminCategoryTableItem>({
    title: 'ID',
    key: 'category_id',
    fixed: 'left',
    width: 84,
    render: (_, category) => (
      <span className="admin-categories-page__category-id">#{category.category_id}</span>
    ),
  }),
  createTextColumn<IAdminCategoryTableItem, 'name'>({
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 240,
    className: 'admin-table-page-name',
  }),
  createRenderColumn<IAdminCategoryTableItem>({
    title: 'Type',
    key: 'type',
    width: 120,
    render: (_, category) => (
      <span className={`admin-categories-page__type admin-categories-page__type--${category.type.toLowerCase()}`}>
        {category.type}
      </span>
    ),
  }),
  createTextColumn<IAdminCategoryTableItem, 'parent_category'>({
    title: 'Parent category',
    dataIndex: 'parent_category',
    width: 220,
  }),
  createTextColumn<IAdminCategoryTableItem, 'short_id'>({
    title: 'Short ID',
    dataIndex: 'short_id',
    width: 190,
  }),
  createNumberColumn<IAdminCategoryTableItem, 'subcategories_count'>({
    title: 'Subcategories',
    dataIndex: 'subcategories_count',
    width: 150,
  }),
  createActionsColumn<IAdminCategoryTableItem>({}),
];

export default CategoriesColumnRender;
