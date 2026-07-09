import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { manifestsService } from './manifests.service.js';

export const manifestsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const warehouseId = String(req.query.warehouseId ?? '');
    const scope = (req.query.scope as 'outbound' | 'inbound' | 'in-transit') ?? 'outbound';
    if (!warehouseId && scope !== 'in-transit') throw ApiError.badRequest('warehouseId is required');
    const items = await manifestsService.list(warehouseId, scope);
    return ok(res, items);
  }),

  liveTrucks: asyncHandler(async (_req: Request, res: Response) => {
    const items = await manifestsService.list('', 'in-transit');
    return ok(res, items);
  }),

  detail: asyncHandler(async (req: Request, res: Response) => {
    const item = await manifestsService.getDetail(req.params.id);
    return ok(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { originWarehouseId, destinationWarehouseId, driverId } = req.body ?? {};
    if (!originWarehouseId) throw ApiError.badRequest('originWarehouseId is required');
    const item = await manifestsService.createDraft({ originWarehouseId, destinationWarehouseId, driverId });
    return created(res, item, 'Manifest created');
  }),

  scan: asyncHandler(async (req: Request, res: Response) => {
    const { packageId, trackingNumber } = req.body ?? {};
    const item = await manifestsService.scanParcel(req.params.id, {
      packageId,
      trackingNumber,
      scannedByUserId: req.user?.id,
    });
    return ok(res, item, 'Parcel scanned onto manifest');
  }),

  depart: asyncHandler(async (req: Request, res: Response) => {
    const { sealNumber } = req.body ?? {};
    if (!sealNumber) throw ApiError.badRequest('sealNumber is required');
    const item = await manifestsService.depart(req.params.id, sealNumber);
    return ok(res, item, 'Manifest departed');
  }),

  arrive: asyncHandler(async (req: Request, res: Response) => {
    const item = await manifestsService.arrive(req.params.id);
    return ok(res, item, 'Manifest arrived');
  }),

  unload: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const item = await manifestsService.unloadScan(req.params.id, trackingNumber);
    return ok(res, item, 'Unload scan recorded');
  }),

  unloadStatus: asyncHandler(async (req: Request, res: Response) => {
    const item = await manifestsService.unloadStatus(req.params.id);
    return ok(res, item);
  }),
};
