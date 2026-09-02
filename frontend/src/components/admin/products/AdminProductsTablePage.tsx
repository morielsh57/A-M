import React, { useCallback, useEffect, useMemo } from 'react';
import { Modal } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AdminFormDrawer from '../../../shared/components/admin-form-drawer/AdminFormDrawer';
import AppTable from '../../../shared/components/app-table/AppTable';
import { getMainCategories } from '../../../shared/store/category/category.store';
import type { CategoryId } from '../../product-page/product.types';
import {
  deleteAdminProduct,
  getAdminProductImagePreview,
  getAdminProducts,
  getAdminProductsCacheKey,
} from './adminProducts.store';
import type { IAdminProductListItem, IAdminProductsListRequestParams } from './adminProducts.types';
import ProductsColumnRender from './ProductsColumnRender';
import { ADMIN_TABLE_PAGE_SIZE } from '../../../app/constants';
import AdminProductForm from './product-form/AdminProductForm';
import type { AdminProductFormMode } from './product-form/adminProductForm.types';
import './AdminProductsTablePage.scss';

const getPageFromSearchParams = (pageParam: string | null) => {
  const page = Number(pageParam || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const getProductSearchText = (product: IAdminProductListItem) => [
  product.name,
  product.catalog_number,
  product.fabric,
  product.supplier_name,
  ...product.colors,
  ...product.sizes,
].filter(Boolean).join(' ').toLowerCase();

const getErrorMessage = (error: unknown) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;

  if (apiError?.message) {
    return apiError.message;
  }

  if (details && typeof details === 'object') {
    return Object.values(details as Record<string, string[] | string>)
      .flat()
      .join(' ');
  }

  return 'Request failed. Please try again.';
};

const AdminProductsTablePage: React.FC = () => {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const [drawerMode, setDrawerMode] = React.useState<AdminProductFormMode>('create');
  const [drawerProductId, setDrawerProductId] = React.useState<string | number>();
  const [drawerProductName, setDrawerProductName] = React.useState<string>();
  const [isProductDrawerOpen, setIsProductDrawerOpen] = React.useState(false);
  const [isProductFormDirty, setIsProductFormDirty] = React.useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const {
    adminProductImagePreviewByProductReq,
    adminProductsByQueryReq,
    deleteAdminProductReq,
  } = useAppSelector((store) => store.adminProductsStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];
  const currentPage = getPageFromSearchParams(searchParams.get('page'));
  const searchValue = searchParams.get('search') || '';
  const currentMainCategory = mainCategories.find(
    (category) => String(category.category_id) === String(categoryId),
  );
  const categoryName = currentMainCategory?.main_category_name || 'Products';

  const productsRequestParams = useMemo<IAdminProductsListRequestParams | undefined>(() => {
    if (!categoryId) {
      return undefined;
    }

    return {
      category: categoryId as CategoryId,
      page_size: ADMIN_TABLE_PAGE_SIZE,
      page: currentPage,
    };
  }, [categoryId, currentPage]);

  const productsCacheKey = productsRequestParams
    ? getAdminProductsCacheKey(productsRequestParams)
    : undefined;
  const adminProductsReq = productsCacheKey
    ? adminProductsByQueryReq[productsCacheKey]
    : undefined;
  const products = adminProductsReq?.data || [];
  const pagination = adminProductsReq?.meta?.pagination;
  const isProductsLoading = !adminProductsReq || adminProductsReq.status === EAPIStatus.PENDING;

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => (
      getProductSearchText(product).includes(normalizedSearch)
    ));
  }, [products, searchValue]);

  useEffect(() => {
    if (
      mainCategories.length === 0
      && getMainCategoriesReq.status === EAPIStatus.IDLE
    ) {
      dispatch(getMainCategories());
    }
  }, [dispatch, getMainCategoriesReq.status, mainCategories.length]);

  useEffect(() => {
    if (!productsRequestParams || adminProductsReq) {
      return;
    }

    dispatch(getAdminProducts(productsRequestParams));
  }, [adminProductsReq, dispatch, productsRequestParams]);

  useEffect(() => {
    filteredProducts.forEach((product) => {
      const productKey = String(product.product_id);
      const previewReq = adminProductImagePreviewByProductReq[productKey];

      if (!previewReq) {
        dispatch(getAdminProductImagePreview({ product_id: product.product_id }));
      }
    });
  }, [adminProductImagePreviewByProductReq, dispatch, filteredProducts]);

  const updateUrlParams = (nextParams: { page?: number; search?: string }) => {
    if (!categoryId) {
      return;
    }

    const params = new URLSearchParams(searchParams);

    if (nextParams.page !== undefined) {
      params.set('page', String(nextParams.page));
    }

    if (nextParams.search !== undefined) {
      const nextSearch = nextParams.search.trim();

      if (nextSearch) {
        params.set('search', nextSearch);
      } else {
        params.delete('search');
      }

      params.set('page', '1');
    }

    navigate(`${APP_ROUTING_PATHS.ADMIN_PRODUCTS_PAGE(categoryId)}?${params.toString()}`);
  };

  const refetchCurrentPage = useCallback(() => {
    if (productsRequestParams) {
      dispatch(getAdminProducts(productsRequestParams));
    }
  }, [dispatch, productsRequestParams]);

  const openCreateProductDrawer = useCallback(() => {
    setDrawerMode('create');
    setDrawerProductId(undefined);
    setDrawerProductName(undefined);
    setIsProductFormDirty(false);
    setIsProductDrawerOpen(true);
  }, []);

  const forceCloseProductDrawer = useCallback(() => {
    setIsProductFormDirty(false);
    setIsProductDrawerOpen(false);
  }, []);

  const closeProductDrawer = useCallback(() => {
    if (!isProductFormDirty) {
      forceCloseProductDrawer();
      return;
    }

    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You changed this form. If you close it now, the changes will not be saved.',
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: forceCloseProductDrawer,
    });
  }, [forceCloseProductDrawer, isProductFormDirty]);

  const handleEditProduct = useCallback((product: IAdminProductListItem) => {
    setDrawerMode('edit');
    setDrawerProductId(product.product_id);
    setDrawerProductName(product.name);
    setIsProductFormDirty(false);
    setIsProductDrawerOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(async (product: IAdminProductListItem) => {
    try {
      await dispatch(deleteAdminProduct({ product_id: product.product_id })).unwrap();
      addToast('Product deleted successfully.', {
        appearance: 'success',
        autoDismiss: true,
      });
      refetchCurrentPage();
    } catch (error) {
      addToast(getErrorMessage(error), {
        appearance: 'error',
        autoDismiss: true,
      });
      throw error;
    }
  }, [addToast, dispatch, refetchCurrentPage]);

  const columns = useMemo(() => ProductsColumnRender({
    adminProductImagePreviewByProductReq,
    isDeletePending: deleteAdminProductReq.status === EAPIStatus.PENDING,
    onDeleteProduct: handleDeleteProduct,
    onEditProduct: handleEditProduct,
  }), [
    adminProductImagePreviewByProductReq,
    deleteAdminProductReq.status,
    handleDeleteProduct,
    handleEditProduct,
  ]);

  if (!categoryId) {
    return (
      <AdminTablePageLayout
        eyebrow="Inventory management"
        title="Products"
        subtitle="Category was not found."
      >
        <AppTable<IAdminProductListItem>
          title="Products"
          subtitle="Category was not found."
          columns={columns}
          data={[]}
          rowKey="product_id"
          emptyText="Category was not found."
        />
      </AdminTablePageLayout>
    );
  }

  return (
    <AdminTablePageLayout
      createButtonLabel="Create product"
      eyebrow="Inventory management"
      isCreateDisabled={!currentMainCategory}
      title={categoryName}
      subtitle="Review products, sort columns, search the loaded page, and remove products when allowed."
      onCreateClick={openCreateProductDrawer}
    >
      <AppTable<IAdminProductListItem>
        columns={columns}
        data={filteredProducts}
        emptyText="No products found."
        loading={isProductsLoading}
        pagination={{
          current: pagination?.page || currentPage,
          pageSize: pagination?.page_size || ADMIN_TABLE_PAGE_SIZE,
          total: pagination?.total_items || products.length,
          showSizeChanger: false,
          onChange: (page) => updateUrlParams({ page }),
        }}
        rowKey="product_id"
        scroll={{ x: 1770 }}
        searchPlaceholder="Search products on this page..."
        searchValue={searchValue}
        subtitle="Search and sorting apply to the currently loaded page."
        title={`${categoryName} products`}
        onSearchChange={(value) => updateUrlParams({ search: value })}
      />

      <AdminFormDrawer
        isOpen={isProductDrawerOpen}
        subtitle="Manage base product details, upload images, and create or edit variants."
        title={drawerMode === 'edit' ? (
          <>
            Edit <span className="admin-form-drawer__title-accent">{drawerProductName || 'product'}</span>
          </>
        ) : 'Create product'}
        onClose={closeProductDrawer}
      >
        <AdminProductForm
          defaultMainCategoryId={currentMainCategory?.category_id}
          disableMainCategorySelect
          initialProductId={drawerProductId}
          mainCategories={mainCategories}
          products={products}
          onCancel={closeProductDrawer}
          onDirtyChange={setIsProductFormDirty}
          onSaved={() => {
            refetchCurrentPage();
            forceCloseProductDrawer();
          }}
        />
      </AdminFormDrawer>
    </AdminTablePageLayout>
  );
};

export default AdminProductsTablePage;
