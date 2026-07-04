import type { Request, Response } from 'express';
import { vehiclesService } from './vehicles.service.js';
import { VEHICLES_MESSAGES } from './vehicles.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const vehiclesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await vehiclesService.list(parseListQuery(req));
    return ok(res, items, VEHICLES_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await vehiclesService.getById(req.params.id);
    return ok(res, item, VEHICLES_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await vehiclesService.create(req.body);
    return created(res, item, VEHICLES_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await vehiclesService.update(req.params.id, req.body);
    return ok(res, item, VEHICLES_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await vehiclesService.remove(req.params.id);
    return noContent(res);
  }),
};
