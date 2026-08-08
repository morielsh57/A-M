export type ProductId = string | number;
export type ProductVariantId = string | number;
export type CategoryId = string | number;
export type SupplierId = string | number;

export interface IProductVariant {
  variant_id: ProductVariantId;
  color: string | null;
  size: string | null;
  quantity: number;
  images: string[];
}

export interface IProductColorOption {
  color: string;
  variant_id: ProductVariantId;
  in_stock: boolean;
  images: string[];
}

export interface IProductCardProduct {
  product_id: ProductId;
  catalog_number: string;
  name: string;
  price: string | number;
  fabric?: string | null;
  selected_color: string | null;
  selected_variant_id: ProductVariantId | null;
  images: string[];
  colors: IProductColorOption[];
}

export interface IProduct {
  product_id: ProductId;
  catalog_number: string;
  name: string;
  description?: string | null;
  information?: string | null;
  price: string | number;
  tags?: string | null;
  fabric?: string | null;
  category_id: CategoryId;
  supplier_id?: SupplierId | null;
  variants: IProductVariant[];
}

export interface IProductsListRequestParams {
  page?: number;
  page_size?: number;
  category?: CategoryId;
}

export type IProductsListResponse = IProductCardProduct[];

export interface IProductDetailRequestParams {
  product_id: ProductId;
}

export type IProductDetailResponse = IProduct;

export interface IProductCardProps {
  product?: IProductCardProduct;
  width?: string;
}
