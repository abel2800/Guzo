import type { Request, Response } from 'express';
import { reportsService } from './reports.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

export const reportsController = {
  orders: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.ordersReport(req.query.from as string, req.query.to as string);
    return ok(res, data, 'Orders report');
  }),

  deliveries: asyncHandler(async (req: Request, res: Response) => {
    const data = await reportsService.deliveriesReport(req.query.from as string, req.query.to as string);
    return ok(res, data, 'Deliveries report');
  }),
};
