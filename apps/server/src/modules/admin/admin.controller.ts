import type { Request, Response } from 'express';
import { prisma } from '@delivery/database';
import { dashboardService } from '../dashboard/dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { buildMeta } from '../../utils/ApiResponse.js';

export const adminController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.adminSummary();
    return ok(res, data, 'Admin summary');
  }),

  auditLogs: asyncHandler(async (req: Request, res: Response) => {
    const q = parseListQuery(req);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ skip: q.skip, take: q.take, orderBy: { createdAt: q.sortOrder } }),
      prisma.auditLog.count(),
    ]);
    return ok(res, items, 'Audit logs', buildMeta(q.page, q.limit, total));
  }),

  activityLogs: asyncHandler(async (req: Request, res: Response) => {
    const q = parseListQuery(req);
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({ skip: q.skip, take: q.take, orderBy: { createdAt: q.sortOrder } }),
      prisma.activityLog.count(),
    ]);
    return ok(res, items, 'Activity logs', buildMeta(q.page, q.limit, total));
  }),

  approveDriver: asyncHandler(async (req: Request, res: Response) => {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'APPROVED', approvedAt: new Date(), approvedById: req.user!.id },
    });
    return ok(res, driver, 'Driver approved');
  }),

  rejectDriver: asyncHandler(async (req: Request, res: Response) => {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'REJECTED', isAvailable: false },
    });
    return ok(res, driver, 'Driver rejected');
  }),
};
