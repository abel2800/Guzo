'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

export interface LeafletMapProps {
  markers?: MapMarker[];
  route?: Array<[number, number]>;
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
}

const ADDIS = { center: [9.0108, 38.7613] as [number, number], zoom: 12 };

function pinIcon(color: string) {
  return L.divIcon({
    className: 'guzo-pin',
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, markers]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LeafletMap({
  markers = [],
  route,
  center = ADDIS.center,
  zoom = ADDIS.zoom,
  className,
  onMapClick,
}: LeafletMapProps) {
  const icons = useMemo(() => markers.map((m) => pinIcon(m.color ?? '#ea580c')), [markers]);

  return (
    <MapContainer center={center} zoom={zoom} className={className} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m, i) => (
        <Marker key={`${m.lat}-${m.lng}-${i}`} position={[m.lat, m.lng]} icon={icons[i]} />
      ))}
      {route && route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#ea580c', weight: 4 }} />}
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      <FitBounds markers={markers} />
    </MapContainer>
  );
}
