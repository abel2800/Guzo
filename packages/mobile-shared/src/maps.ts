import { apiGet } from './api';

export interface MapRouteResult {
  distanceKm: number;
  durationMin: number;
  coordinates: Array<[number, number]>;
  source: 'osrm' | 'haversine';
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export function fetchRoute(
  from: LatLng,
  to: LatLng,
  via: LatLng[] = [],
): Promise<MapRouteResult> {
  const params = new URLSearchParams({
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
  });
  if (via.length) {
    params.set('via', via.map((p) => `${p.lat},${p.lng}`).join(';'));
  }
  return apiGet<MapRouteResult>(`/maps/route?${params.toString()}`);
}

export function geocodeAddress(line1: string, city: string, country = 'Ethiopia'): Promise<GeocodeResult | null> {
  const q = [line1, city, country].filter(Boolean).join(', ');
  return apiGet<GeocodeResult | null>(`/maps/geocode?${new URLSearchParams({ q }).toString()}`);
}
