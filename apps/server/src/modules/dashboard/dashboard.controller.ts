import type { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

export const dashboardController = {
  admin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.adminSummary();
    return ok(res, data, 'Admin dashboard summary');
  }),

  merchant: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.merchantSummary(req.user!.id);
    return ok(res, data, 'Merchant dashboard summary');
  }),

  warehouse: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.warehouseSummary();
    return ok(res, data, 'Warehouse dashboard summary');
  }),

  finance: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.financeSummary();
    return ok(res, data, 'Finance dashboard summary');
  }),

  customer: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.customerSummary(req.user!.id);
    return ok(res, data, 'Customer dashboard summary');
  }),

  support: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.supportSummary();
    return ok(res, data, 'Support dashboard summary');
  }),

  driver: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.driverSummary(req.user!.id);
    return ok(res, data, 'Driver dashboard summary');
  }),
};
