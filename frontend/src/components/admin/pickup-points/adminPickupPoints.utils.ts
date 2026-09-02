import type { IAPIError } from '../../../shared/api/models';
import type {
  IAdminPickupPoint,
  IAdminPickupPointFormErrors,
  IAdminPickupPointFormValues,
  IAdminPickupPointWriteRequest,
} from './adminPickupPoints.types';

export const EMPTY_ADMIN_PICKUP_POINT_FORM_VALUES: IAdminPickupPointFormValues = {
  name: '',
  description: '',
  address: '',
  lat: '',
  lng: '',
  is_active: true,
};

export const getAdminPickupPointValues = (
  pickupPoint?: IAdminPickupPoint,
): IAdminPickupPointFormValues => ({
  name: pickupPoint?.name || '',
  description: pickupPoint?.description || '',
  address: pickupPoint?.address || '',
  lat: pickupPoint?.lat !== undefined ? String(pickupPoint.lat) : '',
  lng: pickupPoint?.lng !== undefined ? String(pickupPoint.lng) : '',
  is_active: pickupPoint?.is_active ?? true,
});

export const getAdminPickupPointPayload = (
  values: IAdminPickupPointFormValues,
): IAdminPickupPointWriteRequest => ({
  name: values.name.trim(),
  description: values.description.trim(),
  address: values.address.trim(),
  lat: values.lat.trim(),
  lng: values.lng.trim(),
  is_active: values.is_active,
});

const isNumberInRange = (value: string, min: number, max: number) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= min && numericValue <= max;
};

export const validateAdminPickupPointForm = (
  values: IAdminPickupPointFormValues,
): IAdminPickupPointFormErrors => {
  const errors: IAdminPickupPointFormErrors = {};

  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.lat.trim()) errors.lat = 'Latitude is required.';
  else if (!isNumberInRange(values.lat, -90, 90)) errors.lat = 'Latitude must be between -90 and 90.';
  if (!values.lng.trim()) errors.lng = 'Longitude is required.';
  else if (!isNumberInRange(values.lng, -180, 180)) errors.lng = 'Longitude must be between -180 and 180.';

  return errors;
};

export const getAdminPickupPointErrorMessage = (
  error: unknown,
  fallback = 'Pickup point request failed. Please try again.',
) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;

  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>)
      .flat()
      .filter(Boolean);

    if (messages.length) return messages.join(' ');
  }

  return apiError?.message || fallback;
};

export const formatAdminPickupPointDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};
