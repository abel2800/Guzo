import type { Request, Response } from 'express';
import { couponsService } from './coupons.service.js';
import { COUPONS_MESSAGES } from './coupons.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const couponsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await couponsService.list(parseListQuery(req));
    return ok(res, items, COUPONS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await couponsService.getById(req.params.id);
    return ok(res, item, COUPONS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await couponsService.create(req.body);
    return created(res, item, COUPONS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await couponsService.update(req.params.id, req.body);
    return ok(res, item, COUPONS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await couponsService.remove(req.params.id);
    return noContent(res);
  }),
};
