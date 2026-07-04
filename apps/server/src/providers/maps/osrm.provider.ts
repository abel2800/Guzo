import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { haversineKm } from '@delivery/utils';

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  geometry?: unknown;
  source: 'osrm' | 'haversine';
}

/**
 * Routing via OSRM (free, OpenStreetMap based). Falls back to a straight-line
 * haversine estimate if OSRM is unreachable, so local dev never breaks.
 */
export class OsrmProvider {
  async route(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): Promise<RouteResult> {
    try {
      const url = `${env.maps.osrmBaseUrl}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`;
      const { data } = await axios.get(url, {
        params: { overview: 'false' },
        timeout: 5000,
      });
      const route = data?.routes?.[0];
      if (!route) throw new Error('No route');
      return {
        distanceKm: Math.round((route.distance / 1000) * 100) / 100,
        durationMin: Math.round(route.duration / 60),
        source: 'osrm',
      };
    } catch (err) {
      logger.warn(`OSRM unavailable, using haversine estimate: ${String(err)}`);
      const distanceKm = haversineKm(from, to);
      return { distanceKm, durationMin: Math.round((distanceKm / 30) * 60), source: 'haversine' };
    }
  }
}

export const osrmProvider = new OsrmProvider();
