import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { receiversService } from './receivers.service.js';

export const receiversController = {
  lookup: asyncHandler(async (req: Request, res: Response) => {
    const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;
    const guzoId = typeof req.query.guzoId === 'string' ? req.query.guzoId : undefined;
    const result = await receiversService.lookup(phone, guzoId);
    return ok(res, result, 'Receiver lookup');
  }),
};
