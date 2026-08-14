import React, { useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppTable from '../../../shared/components/app-table/AppTable';
import {
  createActionsColumn,
  createNumberColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';
import { getMainCategories } from '../../../shared/store/category/category.store';
import type { CategoryId, IMainCategory } from '../../../shared/store/category/category.types';
import './AdminCategories.scss';

interface IAdminCategoryTableItem {
  category_id: CategoryId;
  name: string;
  type: 'Main' | 'Sub';
  parent_category: string;
  short_id: string;
  subcategories_count: number | null;
}

const flattenCategories = (categories: IMainCategory[]): IAdminCategoryTableItem[] => (
  categories.flatMap((mainCategory) => [
    {
      category_id: mainCategory.category_id,
      name: mainCategory.main_category_name,
      type: 'Main' as const,
      parent_category: '—',
      short_id: mainCategory.short_id,
      subcategories_count: mainCategory.subcategories.length,
    },
    ...mainCategory.subcategories.map((subcategory) => ({
      category_id: subcategory.category_id,
      name: subcategory.sub_category_name || 'Unnamed subcategory',
      type: 'Sub' as const,
      parent_category: mainCategory.main_category_name,
      short_id: subcategory.short_id,
      subcategories_count: null,
    })),
  ])
);

const categoryColumns: AppTableColumn<IAdminCategoryTableItem>[] = [
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

const AdminCategories: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchValue, setSearchValue] = useState('');
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const categories = getMainCategoriesReq.data || [];
  const isLoading = getMainCategoriesReq.status === EAPIStatus.PENDING;
  const isError = getMainCategoriesReq.status === EAPIStatus.REJECTED;
  const tableData = useMemo(() => flattenCategories(categories), [categories]);
  const filteredCategories = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) {
      return tableData;
    }

    return tableData.filter((category) => [
      category.category_id,
      category.name,
      category.type,
      category.parent_category,
      category.short_id,
    ].some((value) => String(value).toLowerCase().includes(search)));
  }, [searchValue, tableData]);

  useEffect(() => {
    if (getMainCategoriesReq.status === EAPIStatus.IDLE) {
      void dispatch(getMainCategories());
    }
  }, [dispatch, getMainCategoriesReq.status]);

  const retryAction = isError ? (
    <AppButton variant="secondary" onClick={() => void dispatch(getMainCategories())}>
      <ReloadOutlined /> Try again
    </AppButton>
  ) : undefined;

  return (
    <AdminTablePageLayout
      eyebrow="Catalogue management"
      title="Categories"
      subtitle="Review the main categories and subcategories currently available in the store."
    >
      <AppTable<IAdminCategoryTableItem>
        actions={retryAction}
        columns={categoryColumns}
        data={isError ? [] : filteredCategories}
        emptyText={isError
          ? getMainCategoriesReq.error?.message || 'Categories could not be loaded. Please try again.'
          : 'No categories found.'}
        loading={isLoading}
        rowKey="category_id"
        scroll={{ x: 1116 }}
        searchPlaceholder="Search categories on this page..."
        searchValue={searchValue}
        subtitle={isError
          ? 'Categories could not be loaded.'
          : 'Search and sorting apply to the currently loaded categories.'}
        title="Categories management"
        onSearchChange={setSearchValue}
      />
    </AdminTablePageLayout>
  );
};

export default AdminCategories;
