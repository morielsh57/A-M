import React, { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  Map,
  type MapCameraChangedEvent,
  type MapMouseEvent,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import type { LatLngLiteral, PickupPoint } from '../CheckoutDelivery.types';
import {
  DEFAULT_CENTER,
  PICKUP_MAP_ID,
  PICKUP_MAP_ZOOM,
} from '../CheckoutDelivery.utils';
import PickupPointMarker from './PickupPointMarker';
import './PickupMap.scss';

interface PickupMapProps {
  pickupPoints: PickupPoint[];
  center: LatLngLiteral;
  selectedPickupPointId: number | null;
  onPickupPointSelect: (pickupPointId: number | null) => void;
  onLocationSelect: (location: LatLngLiteral) => void;
  onMapError: (message?: string) => void;
}

const PickupMap: React.FC<PickupMapProps> = ({
  pickupPoints,
  center,
  selectedPickupPointId,
  onPickupPointSelect,
  onLocationSelect,
  onMapError,
}) => {
  const loadingStatus = useApiLoadingStatus();
  // Keep the map draggable while still allowing search and map clicks to recenter it.
  const [camera, setCamera] = useState({
    center,
    zoom: PICKUP_MAP_ZOOM,
  });
  const isMapUnavailable = loadingStatus === APILoadingStatus.FAILED
    || loadingStatus === APILoadingStatus.AUTH_FAILURE;

  useEffect(() => {
    setCamera({
      center,
      zoom: PICKUP_MAP_ZOOM,
    });
  }, [center]);

  useEffect(() => {
    if (isMapUnavailable) {
      onMapError('Google Maps could not be loaded. Please check the map key and try again.');
    }
  }, [isMapUnavailable, onMapError]);

  return (
    <div className="pickup-map" aria-label="Pickup points map">
      {loadingStatus === APILoadingStatus.LOADING && (
        <div className="pickup-map__status">Loading Google Maps...</div>
      )}

      {isMapUnavailable ? (
        <div className="pickup-map__status pickup-map__status--error">
          Google Maps could not be loaded.
        </div>
      ) : (
        <Map
          defaultCenter={DEFAULT_CENTER}
          center={camera.center}
          defaultZoom={PICKUP_MAP_ZOOM}
          zoom={camera.zoom}
          mapId={PICKUP_MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onCameraChanged={(event: MapCameraChangedEvent) => {
            setCamera({
              center: event.detail.center,
              zoom: event.detail.zoom,
            });
          }}
          onClick={(event: MapMouseEvent) => {
            if (event.detail.latLng) onLocationSelect(event.detail.latLng);
          }}
        >

          <AdvancedMarker
            position={center}
            title="Selected location"
            clickable={false}
            zIndex={1}
            className="pickup-map__center-marker"
          >
            <span aria-hidden="true" />
          </AdvancedMarker>

          {pickupPoints.map((point) => {
            const isSelected = point.pick_up_point_id === selectedPickupPointId;

            return (
              <PickupPointMarker
                key={point.pick_up_point_id}
                point={point}
                isSelected={isSelected}
                onPickupPointSelect={onPickupPointSelect}
              />
            );
          })}
        </Map>
      )}
    </div>
  );
};

export default PickupMap;
