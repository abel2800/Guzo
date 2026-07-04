import type { Request, Response } from 'express';
import { deliveriesService } from './deliveries.service.js';
import { DELIVERIES_MESSAGES } from './deliveries.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const deliveriesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await deliveriesService.list(parseListQuery(req));
    return ok(res, items, DELIVERIES_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await deliveriesService.getById(req.params.id);
    return ok(res, item, DELIVERIES_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await deliveriesService.create(req.body);
    return created(res, item, DELIVERIES_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await deliveriesService.update(req.params.id, req.body);
    return ok(res, item, DELIVERIES_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await deliveriesService.remove(req.params.id);
    return noContent(res);
  }),
};
