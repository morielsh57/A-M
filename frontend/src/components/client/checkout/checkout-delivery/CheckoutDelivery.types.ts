export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface PickupPoint {
  pick_up_point_id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  lat: number | string;
  lng: number | string;
  is_active?: boolean;
}

export interface CheckoutDeliveryProps {
  userAddress: string;
}
