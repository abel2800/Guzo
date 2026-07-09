import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export class NominatimProvider {
  async geocode(query: string): Promise<GeocodeResult | null> {
    const q = query.trim();
    if (!q) return null;

    try {
      const { data } = await axios.get<Array<{ lat: string; lon: string; display_name: string }>>(
        `${env.maps.nominatimBaseUrl}/search`,
        {
          params: { q, format: 'json', limit: 1, countrycodes: 'et' },
          headers: { 'User-Agent': 'Guzo-Delivery-Platform/1.0' },
          timeout: 8000,
        },
      );
      const hit = data?.[0];
      if (!hit) return null;
      return {
        lat: parseFloat(hit.lat),
        lng: parseFloat(hit.lon),
        displayName: hit.display_name,
      };
    } catch (err) {
      logger.warn(`Nominatim geocode failed for "${q}": ${String(err)}`);
      return null;
    }
  }
}

export const nominatimProvider = new NominatimProvider();
