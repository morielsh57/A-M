import React from 'react';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppTable from '../../../shared/components/app-table/AppTable';
import {
  createActionsColumn,
  createNumberColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';

interface IAdminCategoryTableItem {
  category_id: string | number;
  name: string;
  parent_category: string;
  sub_categories_count: number;
}

const categoryColumns: AppTableColumn<IAdminCategoryTableItem>[] = [
  createTextColumn<IAdminCategoryTableItem, 'name'>({
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 220,
    className: 'admin-table-page-name',
  }),
  createTextColumn<IAdminCategoryTableItem, 'parent_category'>({
    title: 'Parent category',
    dataIndex: 'parent_category',
    width: 220,
  }),
  createNumberColumn<IAdminCategoryTableItem, 'sub_categories_count'>({
    title: 'Sub categories',
    dataIndex: 'sub_categories_count',
    width: 180,
  }),
  createActionsColumn<IAdminCategoryTableItem>({
    onEdit: () => undefined,
    title: 'Actions',
    width: 112,
  }),
];

const AdminCategoriesPage: React.FC = () => {
  return (
    <AdminTablePageLayout
      createButtonLabel="Create category"
      eyebrow="Catalog structure"
      title="Categories"
      subtitle="Review categories, sort columns, search the loaded page, and remove categories when allowed."
      onCreateClick={() => undefined}
    >
      <AppTable<IAdminCategoryTableItem>
        columns={categoryColumns}
        data={[]}
        emptyText="No categories found."
        rowKey="category_id"
        scroll={{ x: 734 }}
        searchPlaceholder="Search categories on this page..."
        searchValue=""
        subtitle="Search and sorting apply to the currently loaded page."
        title="Categories management"
        onSearchChange={() => undefined}
      />
    </AdminTablePageLayout>
  );
};

export default AdminCategoriesPage;
