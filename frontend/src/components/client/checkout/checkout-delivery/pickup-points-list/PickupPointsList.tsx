import React from 'react';
import type { PickupPoint } from '../CheckoutDelivery.types';
import './PickupPointsList.scss';

interface PickupPointsListProps {
  pickupPoints: PickupPoint[];
  isLoading: boolean;
  userAddress: string;
  selectedPickupPointId: number | null;
  onPickupPointSelect: (pickupPointId: number | null) => void;
}

const PickupPointsList: React.FC<PickupPointsListProps> = ({
  pickupPoints,
  isLoading,
  userAddress,
  selectedPickupPointId,
  onPickupPointSelect,
}) => (
  <div className="pickup-points-list" aria-label="Available pickup points">
    <h3>Available pickup points</h3>
    {pickupPoints.length === 0 && !isLoading ? (
      <p>{userAddress.trim() ? 'Loading starts from your saved address. You can also search or click the map.' : 'Search for a location or click the map to load nearby pickup points.'}</p>
    ) : (
      <ul>
        {pickupPoints.map((point) => {
          const isSelected = point.pick_up_point_id === selectedPickupPointId;

          return (
            <li key={point.pick_up_point_id}>
              <button
                type="button"
                className={isSelected ? 'pickup-points-list__item pickup-points-list__item--selected' : 'pickup-points-list__item'}
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onPickupPointSelect(point.pick_up_point_id)}
              >
                <strong>{point.name}</strong>
                {point.address && <span>{point.address}</span>}
                {point.description && <small>{point.description}</small>}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default PickupPointsList;
