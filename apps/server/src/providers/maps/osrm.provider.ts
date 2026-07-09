import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { haversineKm } from '@delivery/utils';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  coordinates: Array<[number, number]>;
  source: 'osrm' | 'haversine';
}

function haversineRoute(points: LatLng[]): RouteResult {
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);
  }
  distanceKm = Math.round(distanceKm * 100) / 100;
  return {
    distanceKm,
    durationMin: Math.round((distanceKm / 30) * 60),
    coordinates: points.map((p) => [p.lat, p.lng] as [number, number]),
    source: 'haversine',
  };
}

export class OsrmProvider {
  async route(from: LatLng, to: LatLng, via: LatLng[] = []): Promise<RouteResult> {
    const points = [from, ...via, to];
    try {
      const coordPath = points.map((p) => `${p.lng},${p.lat}`).join(';');
      const url = `${env.maps.osrmBaseUrl}/route/v1/driving/${coordPath}`;
      const { data } = await axios.get(url, {
        params: { overview: 'full', geometries: 'geojson' },
        timeout: 8000,
      });
      const route = data?.routes?.[0];
      if (!route) throw new Error('No route');

      const raw = route.geometry?.coordinates as Array<[number, number]> | undefined;
      const coordinates =
        raw?.map(([lng, lat]) => [lat, lng] as [number, number]) ??
        points.map((p) => [p.lat, p.lng] as [number, number]);

      return {
        distanceKm: Math.round((route.distance / 1000) * 100) / 100,
        durationMin: Math.round(route.duration / 60),
        coordinates,
        source: 'osrm',
      };
    } catch (err) {
      logger.warn(`OSRM unavailable, using haversine estimate: ${String(err)}`);
      return haversineRoute(points);
    }
  }
}

export const osrmProvider = new OsrmProvider();
