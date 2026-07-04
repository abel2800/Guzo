import type { Request, Response } from 'express';
import { driversService } from './drivers.service.js';
import { DRIVERS_MESSAGES } from './drivers.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

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
};
