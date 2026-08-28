import React, { FormEvent, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import AppButton from '../../../../../shared/components/app-button/AppButton';
import type { LatLngLiteral } from '../CheckoutDelivery.types';
import { getErrorMessage } from '../CheckoutDelivery.utils';
import './PickupSearch.scss';

interface PickupSearchProps {
  onSearchSuccess: (location: LatLngLiteral) => void;
  onSearchError: (message?: string) => void;
}

const PickupSearch: React.FC<PickupSearchProps> = ({ onSearchSuccess, onSearchError }) => {
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [searchValue, setSearchValue] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchValue.trim();
    if (!query) {
      onSearchError('Enter a location to search for pickup points.');
      return;
    }

    if (!geocodingLibrary) {
      onSearchError('Google geocoding is still loading. Please try again in a moment.');
      return;
    }

    setIsGeocoding(true);
    onSearchError(undefined);

    try {
      const geocoder = new geocodingLibrary.Geocoder();
      const response = await geocoder.geocode({ address: query });
      const location = response.results[0]?.geometry.location;

      if (!location) {
        onSearchError('No location was found for that search.');
        return;
      }

      onSearchSuccess({ lat: location.lat(), lng: location.lng() });
    } catch (error) {
      onSearchError(getErrorMessage(error, 'Location search failed. Please try another search.'));
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <form className="pickup-search" onSubmit={handleSearch}>
      <label htmlFor="pickup-location-search">Search location</label>
      <div>
        <input
          id="pickup-location-search"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="City, street, or address"
          autoComplete="street-address"
        />
        <AppButton type="submit" disabled={isGeocoding}>
          {isGeocoding ? 'Searching...' : 'Search'}
        </AppButton>
      </div>
    </form>
  );
};

export default PickupSearch;
