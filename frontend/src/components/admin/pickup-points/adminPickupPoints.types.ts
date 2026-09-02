export interface IAdminPickupPoint {
  pick_up_point_id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  lat: string | number;
  lng: string | number;
  is_active: boolean;
  date_created: string;
}

export interface IAdminPickupPointsListRequestParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface IAdminPickupPointDetailRequestParams {
  pick_up_point_id: IAdminPickupPoint['pick_up_point_id'];
}

export interface IAdminPickupPointWriteRequest {
  name: string;
  description?: string;
  address?: string;
  lat: string;
  lng: string;
  is_active: boolean;
}

export interface IUpdateAdminPickupPointRequestParams extends IAdminPickupPointDetailRequestParams {
  payload: IAdminPickupPointWriteRequest;
}

export interface IAdminPickupPointFormValues {
  name: string;
  description: string;
  address: string;
  lat: string;
  lng: string;
  is_active: boolean;
}

export interface IAdminPickupPointFormErrors {
  name?: string;
  lat?: string;
  lng?: string;
}
