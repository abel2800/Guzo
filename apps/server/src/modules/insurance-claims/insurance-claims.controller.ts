import type { Request, Response } from 'express';
import { insuranceClaimsService } from './insurance-claims.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { ROLES } from '../../constants/index.js';

export const insuranceClaimsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const isCustomer = req.user!.roles.includes(ROLES.CUSTOMER as never);
    const isStaff = req.user!.roles.some((r) =>
      ([ROLES.ADMIN, ROLES.FINANCE, ROLES.SUPPORT] as string[]).includes(r),
    );
    const scope = isCustomer && !isStaff ? req.user!.id : undefined;
    const { items, meta } = await insuranceClaimsService.list(parseListQuery(req), scope);
    return ok(res, items, 'Insurance claims', meta);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await insuranceClaimsService.create(req.user!.id, req.body ?? {});
    return created(res, item, 'Claim submitted');
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const item = await insuranceClaimsService.updateStatus(
      req.params.id,
      req.body?.status,
      req.body?.resolutionNote,
    );
    return ok(res, item, 'Claim updated');
  }),
};
