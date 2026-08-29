export interface CheckoutPaymentProps {
  hasSelectedItems: boolean;
  selectedItemCount: number;
  total: string | number;
}

export interface CheckoutPayPalProviderProps {
  isCheckoutReady: boolean;
  selectedPickupPointId: number | null;
}

export interface CheckoutPayPalButtonsProps {
  disabled: boolean;
  selectedPickupPointId: number | null;
}
