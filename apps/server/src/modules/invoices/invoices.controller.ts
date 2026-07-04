import type { Request, Response } from 'express';
import { invoicesService } from './invoices.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/index.js';

const STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID'] as const;

export const invoicesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const isCustomer = req.user!.roles.includes(ROLES.CUSTOMER as never);
    const scope = isCustomer && !req.user!.roles.some((r) => r === ROLES.ADMIN || r === ROLES.FINANCE)
      ? { customerUserId: req.user!.id }
      : undefined;
    const { items, meta } = await invoicesService.list(parseListQuery(req), scope);
    return ok(res, items, 'Invoices fetched', meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await invoicesService.getById(req.params.id);
    return ok(res, item, 'Invoice found');
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const status = req.body?.status;
    if (!STATUSES.includes(status)) throw ApiError.badRequest('Invalid invoice status');
    const item = await invoicesService.updateStatus(req.params.id, status);
    return ok(res, item, 'Invoice updated');
  }),
};
