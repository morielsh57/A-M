import type { AxiosRequestConfig } from 'axios';
import { AUTH_LOCAL_STORAGE_KEYS, CART_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import type { ICart } from './cart.types';
import type { IProduct } from '../../product-page/product.types';
import type { ICartItem } from './cart.types';
import {
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  setItemInLocalStorage,
} from '../../../shared/utils/localStorage.utils';

export const GUEST_CART_HEADER = 'X-Guest-Cart-ID';

export const emptyCart: ICart = {
  cart_id: 0,
  guest_cart_id: null,
  total_price: '0.00',
  items: [],
};

export const isCustomerAuthenticated = (): boolean => (
  Boolean(getItemFromLocalStorage<string>(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN))
);

export const getStoredGuestCartId = (): string | null => (
  getItemFromLocalStorage<string>(CART_LOCAL_STORAGE_KEYS.GUEST_CART_ID)
);

export const saveGuestCartId = (guestCartId?: string | null): void => {
  if (!guestCartId) return;
  setItemInLocalStorage(CART_LOCAL_STORAGE_KEYS.GUEST_CART_ID, guestCartId);
};

export const clearGuestCartId = (): void => {
  removeItemFromLocalStorage(CART_LOCAL_STORAGE_KEYS.GUEST_CART_ID);
};

export const getGuestCartRequestConfig = <TRequestData = unknown>(
  guestCartId?: string | null,
): AxiosRequestConfig<TRequestData> | undefined => {
  if (!guestCartId || isCustomerAuthenticated()) return undefined;

  return {
    headers: {
      [GUEST_CART_HEADER]: guestCartId,
    },
  };
};

export const getSelectedCartTotal = (
  cart: ICart | undefined,
  selectedCartProductIds: Array<string | number>,
): number => {
  const selectedIds = new Set(selectedCartProductIds.map(String));

  return cart?.items.reduce((total, item) => {
    if (!selectedIds.has(String(item.cart_product_id))) return total;
    return total + Number(item.total_price || 0);
  }, 0) || 0;
};

export const getCartItemImage = (
  cartItem: ICartItem,
  product?: IProduct,
): string | undefined => {
  const selectedVariant = product?.variants.find((variant) => (
    String(variant.variant_id) === String(cartItem.variant_id)
  ));
  const variantImage = selectedVariant?.images.find(Boolean);

  if (variantImage) return variantImage;

  const primaryProductImage = product?.images?.find((image) => image.is_primary && image.secure_url);
  if (primaryProductImage?.secure_url) return primaryProductImage.secure_url;

  return product?.images?.find((image) => image.secure_url)?.secure_url;
};
