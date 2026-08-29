import type { CartProductId } from '../../cart/cart.types';

export interface CheckoutPaymentProps {
  hasSelectedItems: boolean;
  selectedCartProductIds: CartProductId[];
  selectedItemCount: number;
  total: string | number;
}

export interface CheckoutPayPalProviderProps {
  isCheckoutReady: boolean;
  selectedCartProductIds: CartProductId[];
  selectedPickupPointId: number | null;
}

export interface CheckoutPayPalButtonsProps {
  disabled: boolean;
  selectedCartProductIds: CartProductId[];
  selectedPickupPointId: number | null;
}
