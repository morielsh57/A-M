import React from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import adminLogo from '../../../../../assets/images/admin-logo.png';
import type { PickupPoint } from '../CheckoutDelivery.types';
import { getPickupPointPosition } from '../CheckoutDelivery.utils';

interface PickupPointMarkerProps {
  point: PickupPoint;
  isSelected: boolean;
  onPickupPointSelect: (pickupPointId: number | null) => void;
}

const PickupPointMarker: React.FC<PickupPointMarkerProps> = ({
  point,
  isSelected,
  onPickupPointSelect,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={getPickupPointPosition(point)}
        title={point.name}
        zIndex={isSelected ? 3 : 2}
        onClick={() => onPickupPointSelect(point.pick_up_point_id)}
        className={[
          'pickup-map__marker',
          isSelected ? 'pickup-map__marker--selected' : '',
        ].filter(Boolean).join(' ')}
      >
        <img src={adminLogo} alt="" aria-hidden="true" />
      </AdvancedMarker>

      {isSelected && (
        <InfoWindow
          anchor={marker}
          headerContent={<span className="pickup-map__info-title">{point.name}</span>}
          pixelOffset={[0, -4]}
        >
          <div className="pickup-map__info-window">
            {point.address && <p>{point.address}</p>}
            {point.description && <small>{point.description}</small>}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default PickupPointMarker;
