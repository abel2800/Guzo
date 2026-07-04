import type { Request, Response } from 'express';
import { pricingService } from './pricing.service.js';
import { PRICING_MESSAGES } from './pricing.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const pricingController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await pricingService.list(parseListQuery(req));
    return ok(res, items, PRICING_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await pricingService.getById(req.params.id);
    return ok(res, item, PRICING_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await pricingService.create(req.body);
    return created(res, item, PRICING_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await pricingService.update(req.params.id, req.body);
    return ok(res, item, PRICING_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await pricingService.remove(req.params.id);
    return noContent(res);
  }),
};
