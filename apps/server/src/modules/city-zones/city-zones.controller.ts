import type { Request, Response } from 'express';
import { cityZonesService } from './city-zones.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { writeAudit } from '../../utils/audit.js';

export const cityZonesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await cityZonesService.list(parseListQuery(req));
    return ok(res, items, 'City zones loaded', meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await cityZonesService.getById(req.params.id);
    return ok(res, item, 'City zone loaded');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await cityZonesService.create(req.body);
    await writeAudit({
      actorId: req.user!.id,
      action: 'city_zone.create',
      entityType: 'CityPricingZone',
      entityId: (item as { id: string }).id,
      after: item,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return created(res, item, 'City zone created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const before = await cityZonesService.getById(req.params.id);
    const item = await cityZonesService.update(req.params.id, req.body);
    await writeAudit({
      actorId: req.user!.id,
      action: 'city_zone.update',
      entityType: 'CityPricingZone',
      entityId: req.params.id,
      before,
      after: item,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return ok(res, item, 'City zone updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const before = await cityZonesService.getById(req.params.id);
    await cityZonesService.remove(req.params.id);
    await writeAudit({
      actorId: req.user!.id,
      action: 'city_zone.delete',
      entityType: 'CityPricingZone',
      entityId: req.params.id,
      before,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return noContent(res);
  }),
};
