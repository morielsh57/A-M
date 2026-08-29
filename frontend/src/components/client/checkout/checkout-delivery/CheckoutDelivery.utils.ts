import type { LatLngLiteral, PickupPoint } from './CheckoutDelivery.types';

export const DEFAULT_CENTER: LatLngLiteral = { lat: 32.0853, lng: 34.7818 };
export const PICKUP_MAP_ID = 'DEMO_MAP_ID';
export const PICKUP_MAP_ZOOM = 16;
export const PICKUP_SEARCH_RADIUS_KM = 20;
export const PICKUP_PAGE_SIZE = 50;

export const MOCK_PICKUP_POINTS: PickupPoint[] = [
  {
    pick_up_point_id: 1,
    name: 'קפה גן סיפור פתח תקווה',
    address: 'בזל 2, פתח תקווה',
    description: 'שעות פתיחה: ימים א-ה 8:00-19:30',
    lat: 32.095510623424516,
    lng: 34.86852751219369,
    is_active: true,
  },
  {
    pick_up_point_id: 3,
    name: 'ארומה הקניון הגדול',
    address: "רחוב זאב ז'בוטינסקי 72, פתח תקווה",
    description: 'שעות פתיחה: ימים א-ו 9:30-22:00',
    lat: 32.09292928859256,
    lng: 34.86495480983481,
    is_active: true,
  },
  {
    pick_up_point_id: 2,
    name: 'נונו מימי פתח תקווה',
    address: "בזל 16, פתח תקווה",
    description: "שעות פתיחה: ימים א-ה 8:00-19:30\nימי ו 8:00-14:00",
    lat: 32.097110287272265,
    lng: 34.867722849449294,
    is_active: true,
  },
  {
    pick_up_point_id: 4,
    name: 'סטודיו נוני פיט',
    address: "אריה בן אליעזר 34, רמת גן",
    description: "שעות פתיחה:\n ימים א-ה 8:00-19:30 \nימי ו 8:00-14:00",
    lat: 32.06477009674046,
    lng: 34.83279739831797,
    is_active: true,
  },
];

export const getPickupPointPosition = (point: PickupPoint): LatLngLiteral => ({
  lat: Number(point.lat),
  lng: Number(point.lng),
});

export const isValidLocation = (location: LatLngLiteral) => (
  Number.isFinite(location.lat)
  && Number.isFinite(location.lng)
  && Math.abs(location.lat) <= 90
  && Math.abs(location.lng) <= 180
);

export const getDistanceKm = (pointA: LatLngLiteral, pointB: LatLngLiteral) => {
  const earthRadiusKm = 6371;
  const toRadians = (degree: number) => degree * (Math.PI / 180);
  const latDistance = toRadians(pointB.lat - pointA.lat);
  const lngDistance = toRadians(pointB.lng - pointA.lng);
  const startLat = toRadians(pointA.lat);
  const endLat = toRadians(pointB.lat);

  const haversine = Math.sin(latDistance / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

// TODO: delete when mock pickup points are no longer needed
export const getPickupPointsWithinRadius = (
  center: LatLngLiteral,
  pickupPoints: PickupPoint[] = MOCK_PICKUP_POINTS,
) => {
  if (!isValidLocation(center)) return [];

  return pickupPoints.filter((point) => {
    const pointLocation = getPickupPointPosition(point);

    return point.is_active !== false
      && isValidLocation(pointLocation)
      && getDistanceKm(center, pointLocation) <= PICKUP_SEARCH_RADIUS_KM;
  });
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message || fallback);
  }

  return fallback;
};
