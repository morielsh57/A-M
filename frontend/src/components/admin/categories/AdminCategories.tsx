import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useToasts } from 'react-toast-notifications';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminFormDrawer from '../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppTable from '../../../shared/components/app-table/AppTable';
import type { AppTableColumn } from '../../../shared/components/app-table/appTable.utils';
import {
  deleteCategory,
  getMainCategories,
} from '../../../shared/store/category/category.store';
import type { CategoryId, IMainCategory } from '../../../shared/store/category/category.types';
import CategoriesColumnRender, { type IAdminCategoryTableItem } from './CategoriesColumnRender';
import CategoryForm from './CategoryForm';
import './AdminCategories.scss';
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

const getApiErrorMessage = (error: unknown) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;

  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>)
      .flat()
      .filter(Boolean);

    if (messages.length) return messages.join(' ');
  }

  return apiError?.message || 'Request failed. Please try again.';
};

const AdminCategories: React.FC = () => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const [searchValue, setSearchValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<CategoryId>();
  const [editingCategoryName, setEditingCategoryName] = useState<string>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { deleteCategoryReq, getMainCategoriesReq } = useAppSelector(
    (store) => store.categoryStoreReducer,
  );
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

  const refreshCategories = useCallback(() => {
    void dispatch(getMainCategories());
  }, [dispatch]);

  const openCreateDrawer = useCallback(() => {
    setEditingCategoryId(undefined);
    setEditingCategoryName(undefined);
    setIsFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((category: IAdminCategoryTableItem) => {
    setEditingCategoryId(category.category_id);
    setEditingCategoryName(category.name);
    setIsFormDirty(false);
    setIsDrawerOpen(true);
  }, []);

  const forceCloseDrawer = useCallback(() => {
    setIsFormDirty(false);
    setIsDrawerOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!isFormDirty) {
      forceCloseDrawer();
      return;
    }

    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this category. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseDrawer,
    });
  }, [forceCloseDrawer, isFormDirty]);

  const handleDeleteCategory = useCallback(async (category: IAdminCategoryTableItem) => {
    try {
      await dispatch(deleteCategory({ category_id: category.category_id })).unwrap();
      addToast('Category deleted successfully.', {
        appearance: 'success',
        autoDismiss: true,
      });
      refreshCategories();
    } catch (error) {
      addToast(getApiErrorMessage(error), {
        appearance: 'error',
        autoDismiss: true,
      });
      throw error;
    }
  }, [addToast, dispatch, refreshCategories]);

  const columns = useMemo<AppTableColumn<IAdminCategoryTableItem>[]>(() => (
    CategoriesColumnRender({
      isDeletePending: deleteCategoryReq.status === EAPIStatus.PENDING,
      onDeleteCategory: handleDeleteCategory,
      onEditCategory: openEditDrawer,
    })
  ), [deleteCategoryReq.status, handleDeleteCategory, openEditDrawer]);
  const retryAction = isError ? (
    <AppButton variant="secondary" onClick={() => void dispatch(getMainCategories())}>
      <ReloadOutlined /> Try again
    </AppButton>
  ) : undefined;

  return (
    <AdminTablePageLayout
      createButtonLabel="Add category"
      eyebrow="Catalogue management"
      title="Categories"
      subtitle="Review the main categories and subcategories currently available in the store."
      onCreateClick={openCreateDrawer}
    >
      <AppTable<IAdminCategoryTableItem>
        actions={retryAction}
        columns={columns}
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

      <AdminFormDrawer
        isOpen={isDrawerOpen}
        subtitle="Create a main category or subcategory and manage its catalogue information."
        title={editingCategoryId !== undefined ? (
          <>
            Edit <span className="admin-form-drawer__title-accent">{editingCategoryName}</span>
          </>
        ) : 'Add category'}
        onClose={closeDrawer}
      >
        <CategoryForm
          categoryId={editingCategoryId}
          mainCategories={categories}
          onCancel={closeDrawer}
          onDirtyChange={setIsFormDirty}
          onSaved={() => {
            refreshCategories();
            forceCloseDrawer();
          }}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminCategories;
