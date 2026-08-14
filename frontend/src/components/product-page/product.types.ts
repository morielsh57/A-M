export type ProductId = string | number;
export type ProductVariantId = string | number;
export type CategoryId = string | number;
export type SupplierId = string | number;

export interface IProductVariant {
  variant_id: ProductVariantId;
  color: string | null;
  size: string | null;
  quantity: number;
  in_stock?: boolean;
  is_active?: boolean;
  images: string[];
}

export interface IProductImage {
  image_id: ProductId;
  variant_id?: ProductVariantId | null;
  secure_url: string;
  alt_text?: string | null;
  display_order?: number;
  is_primary?: boolean;
  is_active?: boolean;
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
  category_id?: CategoryId;
  selected_color: string | null;
  selected_variant_id: ProductVariantId | null;
  images: string[];
  colors: IProductColorOption[];
  sizes?: string[];
  in_stock?: boolean;
  average_rating?: string | number | null;
  rating_count?: number;
}

export interface IProductAutocompleteItem {
  product_id: ProductId;
  name: string;
  catalog_number: string;
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
  is_active?: boolean;
  images?: IProductImage[];
  variants: IProductVariant[];
  in_stock?: boolean;
  total_quantity?: number;
  average_rating?: string | number | null;
  rating_count?: number;
}

export interface IProductsListRequestParams {
  page?: number;
  page_size?: number;
  category?: CategoryId;
  main_category?: CategoryId;
  sub_category?: CategoryId;
  search?: string;
  size?: string;
  color?: string;
  min_price?: string | number;
  max_price?: string | number;
  in_stock?: boolean;
  ordering?: 'name' | '-name' | 'price' | '-price' | 'rating' | '-rating' | 'date_created' | '-date_created';
}

export interface IProductAutocompleteRequestParams {
  search: string;
  limit?: number;
}

export interface IHomeCategoryProductsRequest {
  main_category: CategoryId;
  page_size?: number;
}

export interface IProductDetailRequestParams {
  product_id: ProductId;
}

export interface IProductCardProps {
  product?: IProductCardProduct;
  width?: string;
  display?: 'default' | 'compact';
}
