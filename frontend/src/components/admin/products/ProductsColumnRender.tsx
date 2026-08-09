import React from 'react';
import { EAPIStatus, type IAPIRequestState } from '../../../shared/api/models';
import {
  createActionsColumn,
  createCurrencyColumn,
  createListColumn,
  createNumberColumn,
  createRenderColumn,
  createTextColumn,
  type AppTableColumn,
} from '../../../shared/components/app-table/appTable.utils';
import type { IAdminProductImagePreview, IAdminProductListItem } from './adminProducts.types';

interface ProductsColumnRenderProps {
  adminProductImagePreviewByProductReq: Record<string, IAPIRequestState<IAdminProductImagePreview>>;
  isDeletePending: boolean;
  onEditProduct: (product: IAdminProductListItem) => void;
  onDeleteProduct: (product: IAdminProductListItem) => void | Promise<void>;
}

const ProductsColumnRender = ({
  adminProductImagePreviewByProductReq,
  isDeletePending,
  onDeleteProduct,
  onEditProduct,
}: ProductsColumnRenderProps): AppTableColumn<IAdminProductListItem>[] => [
  createTextColumn<IAdminProductListItem, 'name'>({
    title: 'Name',
    dataIndex: 'name',
    fixed: 'left',
    width: 230,
    className: 'admin-table-page-name',
  }),
  createRenderColumn<IAdminProductListItem>({
    title: 'Images',
    key: 'images',
    width: 150,
    render: (_, product) => {
      const previewReq = adminProductImagePreviewByProductReq[String(product.product_id)];
      const previewImages = previewReq?.data?.images || [];
      const isPreviewLoading = !previewReq || previewReq.status === EAPIStatus.PENDING;

      if (isPreviewLoading) {
        return <div className="admin-products-page__image-placeholder">Loading</div>;
      }

      if (!previewImages.length) {
        return <div className="admin-products-page__image-placeholder">No image</div>;
      }

      return (
        <div className="admin-products-page__images">
          {previewImages.map((imageUrl) => (
            <img
              key={imageUrl}
              src={imageUrl}
              alt={product.name}
              className="admin-products-page__image"
            />
          ))}
        </div>
      );
    },
  }),
  createTextColumn<IAdminProductListItem, 'catalog_number'>({
    title: 'Catalog',
    dataIndex: 'catalog_number',
    width: 150,
  }),
  createCurrencyColumn<IAdminProductListItem, 'price'>({
    title: 'Price',
    dataIndex: 'price',
    width: 120,
  }),
  createTextColumn<IAdminProductListItem, 'fabric'>({
    title: 'Fabric',
    dataIndex: 'fabric',
    width: 150,
  }),
  createListColumn<IAdminProductListItem, 'colors'>({
    title: 'Colors',
    dataIndex: 'colors',
    width: 180,
  }),
  createListColumn<IAdminProductListItem, 'sizes'>({
    title: 'Sizes',
    dataIndex: 'sizes',
    width: 160,
  }),
  createNumberColumn<IAdminProductListItem, 'variant_count'>({
    title: 'Variants',
    dataIndex: 'variant_count',
    width: 120,
  }),
  createNumberColumn<IAdminProductListItem, 'total_quantity'>({
    title: 'Quantity',
    dataIndex: 'total_quantity',
    width: 130,
  }),
  createActionsColumn<IAdminProductListItem>({
    onEdit: onEditProduct,
    onDelete: onDeleteProduct,
    deleteConfirmTitle: (product) => `Delete ${product.name}?`,
    deleteConfirmContent: 'This action cannot be undone. Products with images, reviews, or referenced variants may be blocked by the server.',
    deleteOkText: 'Delete product',
    isDeleteDisabled: isDeletePending,
  }),
];

export default ProductsColumnRender;
