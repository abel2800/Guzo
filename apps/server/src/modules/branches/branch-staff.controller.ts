import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { branchStaffService } from './branch-staff.service.js';

export const branchStaffController = {
  assign: asyncHandler(async (req: Request, res: Response) => {
    const { userId, branchId } = req.body ?? {};
    if (!userId || !branchId) throw ApiError.badRequest('userId and branchId are required');
    const data = await branchStaffService.assign(userId, branchId);
    return ok(res, data, 'Staff assigned');
  }),

  listByBranch: asyncHandler(async (req: Request, res: Response) => {
    const data = await branchStaffService.listByBranch(req.params.branchId);
    return ok(res, data, 'Branch staff loaded');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const data = await branchStaffService.myBranches(req.user!.id);
    return ok(res, data, 'My branches');
  }),
};
