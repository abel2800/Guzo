import type { Request, Response } from 'express';
import { reviewsService } from './reviews.service.js';
import { REVIEWS_MESSAGES } from './reviews.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const reviewsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await reviewsService.list(parseListQuery(req));
    return ok(res, items, REVIEWS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await reviewsService.getById(req.params.id);
    return ok(res, item, REVIEWS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await reviewsService.create(req.body);
    return created(res, item, REVIEWS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await reviewsService.update(req.params.id, req.body);
    return ok(res, item, REVIEWS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await reviewsService.remove(req.params.id);
    return noContent(res);
  }),

  createForOrder: asyncHandler(async (req: Request, res: Response) => {
    const { rating, comment } = req.body ?? {};
    const item = await reviewsService.createForOrder(req.user!.id, req.params.orderId, Number(rating), comment);
    return created(res, item, REVIEWS_MESSAGES.CREATED);
  }),

  pending: asyncHandler(async (req: Request, res: Response) => {
    const items = await reviewsService.pendingForCustomer(req.user!.id);
    return ok(res, items, 'Orders awaiting rating');
  }),
};
