import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { familyService } from './family.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const familyController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const ownerUserId = req.params.ownerUserId;
    if (req.user!.id !== ownerUserId && !req.user!.roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r))) {
      throw ApiError.forbidden('Not allowed');
    }
    const items = await familyService.listForOwner(ownerUserId);
    return ok(res, items);
  }),

  link: asyncHandler(async (req: Request, res: Response) => {
    const { ownerUserId, memberUserId, relation, label } = req.body as {
      ownerUserId: string;
      memberUserId: string;
      relation?: string;
      label?: string;
    };
    if (req.user!.id !== ownerUserId && !req.user!.roles.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r))) {
      throw ApiError.forbidden('Not allowed');
    }
    const item = await familyService.link(ownerUserId, memberUserId, relation ?? 'OTHER', label);
    return created(res, item, 'Family member linked');
  }),
};
