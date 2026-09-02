import React, { useCallback, useRef, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import {
  clearSelectedPickupPoint,
  getPickupPoints,
  setSelectedPickupPointId,
} from '../checkout.store';
import DefaultLocationLoader from './default-location-loader/DefaultLocationLoader';
import PickupMap from './pickup-map/PickupMap';
import PickupPointsList from './pickup-points-list/PickupPointsList';
import PickupSearch from './pickup-search/PickupSearch';
import type {
  CheckoutDeliveryProps,
  LatLngLiteral,
} from './CheckoutDelivery.types';
import {
  DEFAULT_CENTER,
  normalizePickupLocation,
  PICKUP_SEARCH_RADIUS_KM,
} from './CheckoutDelivery.utils';
import './CheckoutDelivery.scss';

const CheckoutDelivery: React.FC<CheckoutDeliveryProps> = ({ userAddress }) => {
  const dispatch = useAppDispatch();
  const googleMapsApiKey = import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  const [center, setCenter] = useState<LatLngLiteral>(DEFAULT_CENTER);
  const [mapError, setMapError] = useState<string>();
  const [geocodingError, setGeocodingError] = useState<string>();
  const hasManuallySelectedLocationRef = useRef(false);
  const { selectedPickupPointId, getPickupPointsReq } = useAppSelector(
    (store) => store.checkoutStoreReducer,
  );
  const pickupPoints = getPickupPointsReq.data || [];
  const isPickupPointsLoading = getPickupPointsReq.status === EAPIStatus.PENDING;

  const loadPickupPoints = useCallback((location: LatLngLiteral) => {
    const normalizedLocation = normalizePickupLocation(location);
    setCenter(normalizedLocation);
    dispatch(getPickupPoints({
      lat: normalizedLocation.lat,
      lng: normalizedLocation.lng,
      radius_km: PICKUP_SEARCH_RADIUS_KM,
    }));
  }, [dispatch]);

  const handleDefaultLocationSelect = useCallback((location: LatLngLiteral) => {
    if (hasManuallySelectedLocationRef.current) return;

    setGeocodingError(undefined);
    dispatch(clearSelectedPickupPoint());
    loadPickupPoints(location);
  }, [dispatch, loadPickupPoints]);

  const handleLocationSelect = useCallback((location: LatLngLiteral) => {
    hasManuallySelectedLocationRef.current = true;
    setGeocodingError(undefined);
    dispatch(clearSelectedPickupPoint());
    loadPickupPoints(location);
  }, [dispatch, loadPickupPoints]);

  const handlePickupPointSelect = useCallback((pickupPointId: number | null) => {
    dispatch(setSelectedPickupPointId(pickupPointId));
  }, [dispatch]);

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
            onLocationResolve={handleDefaultLocationSelect}
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

      {isPickupPointsLoading && <p className="checkout-delivery__status">Loading pickup points...</p>}
      {getPickupPointsReq.error && <p className="checkout-delivery__error">{getPickupPointsReq.error.message || 'Pickup points could not be loaded.'}</p>}

      <PickupPointsList
        pickupPoints={pickupPoints}
        isLoading={isPickupPointsLoading}
        userAddress={userAddress}
        selectedPickupPointId={selectedPickupPointId}
        onPickupPointSelect={handlePickupPointSelect}
      />
    </section>
  );
};

export default CheckoutDelivery;
