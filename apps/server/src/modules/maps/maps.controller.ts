import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { osrmProvider } from '../../providers/maps/osrm.provider.js';
import { nominatimProvider } from '../../providers/maps/nominatim.provider.js';

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export const mapsController = {
  route: asyncHandler(async (req: Request, res: Response) => {
    const fromLat = toNum(req.query.fromLat);
    const fromLng = toNum(req.query.fromLng);
    const toLat = toNum(req.query.toLat);
    const toLng = toNum(req.query.toLng);
    const via = String(req.query.via ?? '')
      .split(';')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [lat, lng] = pair.split(',').map((v) => Number(v.trim()));
        return { lat, lng };
      })
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    const route = await osrmProvider.route(
      { lat: fromLat, lng: fromLng },
      { lat: toLat, lng: toLng },
      via,
    );
    return ok(res, route, 'Route calculated');
  }),

  geocode: asyncHandler(async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim();
    const result = await nominatimProvider.geocode(q);
    return ok(res, result, result ? 'Address found' : 'No results');
  }),
};
