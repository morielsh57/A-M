import type { ProductId, ProductVariantId } from '../../product-page/product.types';

export type CartProductId = string | number;

export interface ICartItem {
  cart_product_id: CartProductId;
  variant_id: ProductVariantId;
  product_id: ProductId;
  product_name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  available_quantity: number;
  unit_price: string | number;
  total_price: string | number;
}

export interface ICart {
  cart_id: number;
  guest_cart_id?: string | null;
  total_price: string | number;
  items: ICartItem[];
}

export interface IAddCartItemRequest {
  variant_id: ProductVariantId;
  quantity: number;
}

export interface IUpdateCartItemRequest {
  cart_product_id: CartProductId;
  quantity: number;
}

export interface IRemoveCartItemRequest {
  cart_product_id: CartProductId;
}
