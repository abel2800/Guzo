import type { Request, Response } from 'express';
import { otpService } from './otp.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

export const otpController = {
  send: asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.send(req.body.phone);
    return ok(res, { phone: result.phone }, result.message);
  }),

  verify: asyncHandler(async (req: Request, res: Response) => {
    await otpService.verify(req.body.phone, req.body.code);
    return ok(res, null, 'Phone verified');
  }),
};
