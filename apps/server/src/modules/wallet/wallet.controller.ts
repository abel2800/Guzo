import type { Request, Response } from 'express';
import { walletService } from './wallet.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const walletController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    const data = await walletService.summary(req.user!.id);
    return ok(res, data, 'Wallet summary');
  }),

  transactions: asyncHandler(async (req: Request, res: Response) => {
    const query = parseListQuery(req);
    const { items, meta } = await walletService.transactions(req.user!.id, query);
    return ok(res, items, 'Wallet transactions', meta);
  }),

  topUp: asyncHandler(async (req: Request, res: Response) => {
    const amount = Number(req.body?.amount);
    const description = typeof req.body?.description === 'string' ? req.body.description : undefined;
    const data = await walletService.topUp(req.user!.id, amount, description);
    return ok(res, data, 'Top-up successful');
  }),
};
