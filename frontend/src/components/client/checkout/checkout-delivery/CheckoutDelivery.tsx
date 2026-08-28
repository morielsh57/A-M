import React, { useCallback, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { API_ROUTES } from '../../../../app/routing';
import { apiService } from '../../../../shared/api/axios';
import DefaultLocationLoader from './default-location-loader/DefaultLocationLoader';
import PickupMap from './pickup-map/PickupMap';
import PickupPointsList from './pickup-points-list/PickupPointsList';
import PickupSearch from './pickup-search/PickupSearch';
import type {
  CheckoutDeliveryProps,
  LatLngLiteral,
  PickupPoint,
  PickupPointRequestState,
} from './CheckoutDelivery.types';
import {
  DEFAULT_CENTER,
  getErrorMessage,
  getPickupPointsWithinRadius,
  normalizePickupPoints,
  PICKUP_PAGE_SIZE,
  PICKUP_SEARCH_RADIUS_KM,
  USE_MOCK_PICKUP_POINTS,
} from './CheckoutDelivery.utils';
import './CheckoutDelivery.scss';

const CheckoutDelivery: React.FC<CheckoutDeliveryProps> = ({
  userAddress,
  selectedPickupPointId,
  onPickupPointSelect,
}) => {
  const googleMapsApiKey = import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [center, setCenter] = useState<LatLngLiteral>(DEFAULT_CENTER);
  const [pickupRequest, setPickupRequest] = useState<PickupPointRequestState>({ isLoading: false });
  const [mapError, setMapError] = useState<string>();
  const [geocodingError, setGeocodingError] = useState<string>();

  const loadPickupPointsFromApi = async (location: LatLngLiteral) => {
    try {
      const response = await apiService.get<PickupPoint[]>(API_ROUTES.PICKUP_POINTS, {
        params: {
          lat: location.lat,
          lng: location.lng,
          radius_km: PICKUP_SEARCH_RADIUS_KM,
          page_size: PICKUP_PAGE_SIZE,
          is_active: true,
        },
      });

      return normalizePickupPoints(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Pickup points could not be loaded.'));
    }
  };

  const loadPickupPoints = useCallback(async (location: LatLngLiteral) => {
    setCenter(location);
    setPickupRequest({ isLoading: true, error: undefined });

    try {
      const nextPickupPoints = USE_MOCK_PICKUP_POINTS
        ? getPickupPointsWithinRadius(location)
        : await loadPickupPointsFromApi(location);

      setPickupPoints(nextPickupPoints);
      setPickupRequest({ isLoading: false });
    } catch (error) {
      setPickupPoints([]);
      setPickupRequest({
        isLoading: false,
        error: getErrorMessage(error, 'Pickup points could not be loaded.'),
      });
    }
  }, []);

  const handleLocationSelect = useCallback((location: LatLngLiteral) => {
    setGeocodingError(undefined);
    onPickupPointSelect(null);
    loadPickupPoints(location);
  }, [loadPickupPoints, onPickupPointSelect]);

  const handlePickupPointSelect = useCallback((pickupPointId: number | null) => {
    onPickupPointSelect(pickupPointId);
  }, [onPickupPointSelect]);

  return (
    <section className="checkout-delivery checkout-card">
      <div className="checkout-card__heading">
        <span>2</span>
        <div>
          <h2>Pickup point</h2>
          <p>Pickup points are loaded within 20km of your saved address, search, or map click.</p>
        </div>
      </div>

      {!googleMapsApiKey ? (
        <p className="checkout-delivery__error">Google Maps is not configured. Add REACT_APP_GOOGLE_MAPS_API_KEY to the frontend environment.</p>
      ) : (
        <APIProvider
          apiKey={googleMapsApiKey}
          libraries={['geocoding', 'marker']}
          onError={() => setMapError('Google Maps could not be loaded. Please check the map key and try again.')}
        >
          <DefaultLocationLoader
            userAddress={userAddress}
            onLocationResolve={handleLocationSelect}
            onLocationError={setGeocodingError}
          />
          <PickupSearch
            onSearchSuccess={handleLocationSelect}
            onSearchError={setGeocodingError}
          />

          {geocodingError && <p className="checkout-delivery__error">{geocodingError}</p>}
          {mapError && <p className="checkout-delivery__error">{mapError}</p>}

          <PickupMap
            pickupPoints={pickupPoints}
            center={center}
            selectedPickupPointId={selectedPickupPointId}
            onPickupPointSelect={handlePickupPointSelect}
            onLocationSelect={handleLocationSelect}
            onMapError={setMapError}
          />
        </APIProvider>
      )}

      {pickupRequest.isLoading && <p className="checkout-delivery__status">Loading pickup points...</p>}
      {pickupRequest.error && <p className="checkout-delivery__error">{pickupRequest.error}</p>}

      <PickupPointsList
        pickupPoints={pickupPoints}
        isLoading={pickupRequest.isLoading}
        userAddress={userAddress}
        selectedPickupPointId={selectedPickupPointId}
        onPickupPointSelect={handlePickupPointSelect}
      />
    </section>
  );
};

export default CheckoutDelivery;
