import React, { useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { LatLngLiteral } from '../CheckoutDelivery.types';
import { getErrorMessage } from '../CheckoutDelivery.utils';
import './DefaultLocationLoader.scss';

interface DefaultLocationLoaderProps {
  userAddress: string;
  onLocationResolve: (location: LatLngLiteral) => void;
  onLocationError: (message?: string) => void;
}

const DefaultLocationLoader: React.FC<DefaultLocationLoaderProps> = ({
  userAddress,
  onLocationResolve,
  onLocationError,
}) => {
  const geocodingLibrary = useMapsLibrary('geocoding');
  const lastRequestedAddressRef = useRef('');

  useEffect(() => {
    const address = userAddress.trim();

    if (!address || !geocodingLibrary || lastRequestedAddressRef.current === address) return;

    let isActive = true;
    lastRequestedAddressRef.current = address;

    const loadDefaultLocation = async () => {
      try {
        const geocoder = new geocodingLibrary.Geocoder();
        const response = await geocoder.geocode({ address });
        const location = response.results[0]?.geometry.location;

        if (!isActive) return;

        if (!location) {
          onLocationError('Your saved address could not be found. Search for a location to load pickup points.');
          return;
        }

        onLocationError(undefined);
        onLocationResolve({ lat: location.lat(), lng: location.lng() });
      } catch (error) {
        if (!isActive) return;
        onLocationError(getErrorMessage(error, 'Your saved address could not be geocoded. Search for a location to load pickup points.'));
      }
    };

    loadDefaultLocation();

    return () => {
      isActive = false;
    };
  }, [geocodingLibrary, onLocationError, onLocationResolve, userAddress]);

  return null;
};

export default DefaultLocationLoader;
