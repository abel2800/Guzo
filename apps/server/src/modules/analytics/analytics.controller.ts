import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

export const analyticsController = {
  ordersOverTime: asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const data = await analyticsService.ordersOverTime(days);
    return ok(res, data, 'Orders over time');
  }),

  revenueByDeliveryType: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.revenueByDeliveryType();
    return ok(res, data, 'Revenue by delivery type');
  }),

  topDrivers: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.topDrivers();
    return ok(res, data, 'Top drivers');
  }),

  operationsMetrics: asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const data = await analyticsService.operationsMetrics(days);
    return ok(res, data, 'Operations metrics');
  }),

  satisfactionSummary: asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 90));
    const data = await analyticsService.satisfactionSummary(days);
    return ok(res, data, 'Satisfaction summary');
  }),
};
