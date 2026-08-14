import React from 'react';
import {
  APIProvider,
  InfoWindow as VisInfoWindow,
  Map as VisMap,
  Marker as VisMarker,
} from '@vis.gl/react-google-maps';

type ElementProp = React.ReactElement<{ style?: React.CSSProperties }>;

const googleMapsApiKey = import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const getStyle = (element?: ElementProp) => element?.props?.style || {};

export const GoogleMap: React.FC<any> = ({
  children,
  defaultZoom,
  defaultCenter,
  center,
}) => (
  <VisMap
    defaultZoom={defaultZoom}
    defaultCenter={defaultCenter}
    center={center}
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </VisMap>
);

export const Marker: React.FC<any> = ({ onClick, ...props }) => (
  <VisMarker {...props} onClick={onClick} />
);

export const InfoWindow: React.FC<any> = ({ onCloseClick, children, ...props }) => (
  <VisInfoWindow {...props} onCloseClick={onCloseClick}>
    {children}
  </VisInfoWindow>
);

export const withGoogleMap = (Component: React.ComponentType<any>) => {
  const WithGoogleMap: React.FC<any> = ({ containerElement, mapElement, ...props }) => (
    <div style={getStyle(containerElement)}>
      <div style={getStyle(mapElement)}>
        <Component {...props} />
      </div>
    </div>
  );

  return WithGoogleMap;
};

export const withScriptjs = (Component: React.ComponentType<any>) => {
  const WithScriptjs: React.FC<any> = ({ googleMapURL: _googleMapURL, loadingElement, ...props }) => {
    if (!googleMapsApiKey) {
      return loadingElement || null;
    }

    return (
      <APIProvider apiKey={googleMapsApiKey} libraries={['places']}>
        <Component {...props} />
      </APIProvider>
    );
  };

  return WithScriptjs;
};
