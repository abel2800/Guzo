import type { Request, Response } from 'express';
import { merchantsService } from './merchants.service.js';
import { MERCHANTS_MESSAGES } from './merchants.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const merchantsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await merchantsService.list(parseListQuery(req));
    return ok(res, items, MERCHANTS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await merchantsService.getById(req.params.id);
    return ok(res, item, MERCHANTS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await merchantsService.create(req.body);
    return created(res, item, MERCHANTS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await merchantsService.update(req.params.id, req.body);
    return ok(res, item, MERCHANTS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await merchantsService.remove(req.params.id);
    return noContent(res);
  }),
};
