import type { Request, Response } from 'express';
import { loyaltyService } from './loyalty.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

export const loyaltyController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    const data = await loyaltyService.getProfile(req.user!.id);
    return ok(res, data, 'Loyalty profile');
  }),

  applyReferral: asyncHandler(async (req: Request, res: Response) => {
    const code = req.body?.code;
    if (!code) throw ApiError.badRequest('code is required');
    const data = await loyaltyService.applyReferral(req.user!.id, code);
    return ok(res, data, 'Referral applied');
  }),
};
