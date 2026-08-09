import type {
  CategoryId,
  IProduct,
  ProductId,
  ProductVariantId,
  SupplierId,
} from '../../product-page/product.types';

export interface IAdminProductsListRequestParams {
  page?: number;
  page_size?: number;
  category?: CategoryId;
}

export interface IAdminProductListItem {
  product_id: ProductId;
  catalog_number: string;
  name: string;
  category_id: CategoryId;
  price: string | number;
  fabric?: string | null;
  colors: string[];
  sizes: string[];
  variant_count: number;
  total_quantity: number;
}

export interface IAdminProductDetailRequestParams {
  product_id: ProductId;
}

export interface IAdminProductImage {
  image_id: ProductId;
  secure_url: string;
  alt_text?: string;
  is_active?: boolean;
  is_primary?: boolean;
}

export interface IAdminProductDetail extends IProduct {
  images?: IAdminProductImage[];
}

export interface IAdminProductImagePreviewRequestParams {
  product_id: ProductId;
}

export interface IAdminProductImagePreview {
  product_id: ProductId;
  images: string[];
}

export interface IDeleteAdminProductRequestParams {
  product_id: ProductId;
}

export interface IAdminProductWriteRequest {
  catalog_number: string;
  name: string;
  description?: string | null;
  information?: string | null;
  price: string | number;
  tags?: string | null;
  fabric?: string | null;
  category_id: CategoryId;
  supplier_id?: SupplierId | null;
}

export interface IAdminProductVariantWriteRequest {
  color?: string | null;
  size?: string | null;
  quantity: number;
  images: string[];
}

export interface IAdminProductVariantWriteRequestParams {
  product_id: ProductId;
  variant_id?: ProductVariantId;
}
