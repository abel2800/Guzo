import type { Request, Response } from 'express';
import { warehousesService } from './warehouses.service.js';
import { warehouseOpsService } from './warehouse-ops.service.js';
import { WAREHOUSES_MESSAGES } from './warehouses.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export const warehousesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await warehousesService.list(parseListQuery(req));
    return ok(res, items, WAREHOUSES_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await warehousesService.getById(req.params.id);
    return ok(res, item, WAREHOUSES_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await warehousesService.create(req.body);
    return created(res, item, WAREHOUSES_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await warehousesService.update(req.params.id, req.body);
    return ok(res, item, WAREHOUSES_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await warehousesService.remove(req.params.id);
    return noContent(res);
  }),

  // ---- Floor operations ----

  receive: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber, shelfCode, zone, note } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const inv = await warehouseOpsService.receive(req.params.id, { trackingNumber, shelfCode, zone, note });
    return created(res, inv, 'Parcel received');
  }),

  sort: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber, shelfCode, zone } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    if (!shelfCode) throw ApiError.badRequest('shelfCode is required');
    const inv = await warehouseOpsService.sort(req.params.id, { trackingNumber, shelfCode, zone });
    return ok(res, inv, 'Parcel sorted');
  }),

  dispatch: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber, note } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const inv = await warehouseOpsService.dispatch(req.params.id, { trackingNumber, note });
    return ok(res, inv, 'Parcel dispatched');
  }),

  inventory: asyncHandler(async (req: Request, res: Response) => {
    const stateParam = req.query.state;
    const state = stateParam === 'dispatched' || stateParam === 'all' ? stateParam : 'in-stock';
    const { items, meta } = await warehouseOpsService.listInventory(req.params.id, parseListQuery(req), state);
    return ok(res, items, 'Inventory fetched', meta);
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const data = await warehouseOpsService.stats(req.params.id);
    return ok(res, data, 'Warehouse stats');
  }),
};
