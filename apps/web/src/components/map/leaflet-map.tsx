'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
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

const ADDIS: [number, number] = [9.0108, 38.7613];

function pinIcon(color: string) {
  return L.divIcon({
    className: 'guzo-pin',
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -18],
  });
}

function FitBounds({
  markers,
  route,
}: {
  markers: MapMarker[];
  route?: Array<[number, number]>;
}) {
  const map = useMap();
  useEffect(() => {
    const points: Array<[number, number]> = [
      ...markers.map((m) => [m.lat, m.lng] as [number, number]),
      ...(route ?? []),
    ];
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, markers, route]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    fix();
    const t = window.setTimeout(fix, 120);
    window.addEventListener('resize', fix);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', fix);
    };
  }, [map]);
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
  center = ADDIS,
  zoom = 12,
  className,
  onMapClick,
}: LeafletMapProps) {
  const icons = useMemo(() => markers.map((m) => pinIcon(m.color ?? '#ea580c')), [markers]);
  const mapKey = useMemo(
    () => markers.map((m) => `${m.lat},${m.lng},${m.label ?? ''}`).join('|') || 'default',
    [markers],
  );

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%', minHeight: 200 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {markers.map((m, i) => (
        <Marker key={`${m.lat}-${m.lng}-${m.label ?? i}`} position={[m.lat, m.lng]} icon={icons[i]}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
      {route && route.length > 1 && (
        <Polyline positions={route} pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.85 }} />
      )}
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      <FitBounds markers={markers} route={route} />
      <MapResizer />
    </MapContainer>
  );
}
