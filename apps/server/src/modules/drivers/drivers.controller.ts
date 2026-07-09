import type { Request, Response } from 'express';
import { driversService } from './drivers.service.js';
import { driverOpsService } from './driver-ops.service.js';
import { DRIVERS_MESSAGES } from './drivers.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export const driversController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await driversService.list(parseListQuery(req));
    return ok(res, items, DRIVERS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await driversService.getById(req.params.id);
    return ok(res, item, DRIVERS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await driversService.create(req.body);
    return created(res, item, DRIVERS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await driversService.update(req.params.id, req.body);
    return ok(res, item, DRIVERS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await driversService.remove(req.params.id);
    return noContent(res);
  }),

  myManifests: asyncHandler(async (req: Request, res: Response) => {
    const items = await driverOpsService.listManifests(req.user!.id);
    return ok(res, items, 'Driver manifests');
  }),

  myManifestDetail: asyncHandler(async (req: Request, res: Response) => {
    const item = await driverOpsService.getManifest(req.user!.id, req.params.manifestId);
    return ok(res, item, 'Manifest detail');
  }),

  scanMyManifest: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const item = await driverOpsService.scanManifest(req.user!.id, req.params.manifestId, trackingNumber);
    return ok(res, item, 'Parcel scanned onto manifest');
  }),

  departMyManifest: asyncHandler(async (req: Request, res: Response) => {
    const item = await driverOpsService.departManifest(req.user!.id, req.params.manifestId, req.body?.sealNumber);
    return ok(res, item, 'Manifest departed');
  }),

  arriveMyManifest: asyncHandler(async (req: Request, res: Response) => {
    const item = await driverOpsService.arriveManifest(req.user!.id, req.params.manifestId);
    return ok(res, item, 'Manifest arrived');
  }),

  unloadMyManifest: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const item = await driverOpsService.unloadManifest(req.user!.id, req.params.manifestId, trackingNumber);
    return ok(res, item, 'Parcel unloaded');
  }),

  myEarnings: asyncHandler(async (req: Request, res: Response) => {
    const data = await driverOpsService.getEarnings(req.user!.id);
    return ok(res, data, 'Driver earnings');
  }),

  myRoute: asyncHandler(async (req: Request, res: Response) => {
    const data = await driverOpsService.optimizedRoute(req.user!.id);
    return ok(res, data, 'Optimized route');
  }),

  myVehicle: asyncHandler(async (req: Request, res: Response) => {
    const data = await driverOpsService.getMyVehicle(req.user!.id);
    return ok(res, data, data ? 'Vehicle found' : 'No vehicle assigned');
  }),

  myVehicleLogs: asyncHandler(async (req: Request, res: Response) => {
    const items = await driverOpsService.listVehicleLogs(req.user!.id);
    return ok(res, items, 'Vehicle logs');
  }),

  createVehicleLog: asyncHandler(async (req: Request, res: Response) => {
    const { type, odometerKm, amount, note, metadata } = req.body ?? {};
    if (!type) throw ApiError.badRequest('type is required');
    const item = await driverOpsService.createVehicleLog(req.user!.id, {
      type,
      odometerKm: odometerKm != null ? Number(odometerKm) : undefined,
      amount: amount != null ? Number(amount) : undefined,
      note,
      metadata,
    });
    return created(res, item, 'Vehicle log recorded');
  }),
};
