import type { Request, Response } from 'express';
import { paymentsService } from './payments.service.js';
import { PAYMENTS_MESSAGES } from './payments.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const paymentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await paymentsService.list(parseListQuery(req));
    return ok(res, items, PAYMENTS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await paymentsService.getById(req.params.id);
    return ok(res, item, PAYMENTS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await paymentsService.create(req.body);
    return created(res, item, PAYMENTS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await paymentsService.update(req.params.id, req.body);
    return ok(res, item, PAYMENTS_MESSAGES.UPDATED);
  }),

  refund: asyncHandler(async (req: Request, res: Response) => {
    const amount = req.body?.amount != null ? Number(req.body.amount) : undefined;
    const item = await paymentsService.refund(req.params.id, { amount, reason: req.body?.reason });
    return ok(res, item, PAYMENTS_MESSAGES.REFUNDED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await paymentsService.remove(req.params.id);
    return noContent(res);
  }),
};
