import type {
  CategoryId,
  ProductId,
  ProductVariantId,
  SupplierId,
} from '../../../product-page/product.types';
import type { IAdminProductImage } from '../adminProducts.types';
import { ADMIN_PRODUCT_NEW_OPTION_VALUE } from './adminProductForm.constants';

export type AdminProductFormMode = 'create' | 'edit';
export type AdminProductSelectorValue = ProductId | typeof ADMIN_PRODUCT_NEW_OPTION_VALUE;

export interface AdminProductBaseFormValues {
  catalog_number: string;
  name: string;
  description: string;
  information: string;
  price: string;
  tags: string;
  fabric: string;
  main_category_id: CategoryId | null;
  sub_category_id: CategoryId | null;
  supplier_id: SupplierId | null;
  is_active: boolean;
}

export interface AdminProductVariantFormRow {
  color: string;
  existingImages: IAdminProductImage[];
  files: File[];
  is_active: boolean;
  localId: string;
  quantity: string;
  size: string;
  variant_id?: ProductVariantId;
}

export interface AdminProductVariantRowError {
  color?: string;
  duplicate?: string;
  quantity?: string;
  size?: string;
}
