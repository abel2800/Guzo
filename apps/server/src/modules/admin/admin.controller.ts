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
      prisma.auditLog.findMany({
        skip: q.skip,
        take: q.take,
        orderBy: { createdAt: q.sortOrder },
        include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.auditLog.count(),
    ]);
    return ok(res, items, 'Audit logs', buildMeta(q.page, q.limit, total));
  }),

  activityLogs: asyncHandler(async (req: Request, res: Response) => {
    const q = parseListQuery(req);
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip: q.skip,
        take: q.take,
        orderBy: { createdAt: q.sortOrder },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.activityLog.count(),
    ]);
    return ok(res, items, 'Activity logs', buildMeta(q.page, q.limit, total));
  }),

    exceptions: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const [failedOrders, lostPackages, exceptionPackages, failedDeliveries, urgentTickets] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: ['FAILED', 'RETURNED'] } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, orderNumber: true, status: true, updatedAt: true },
      }),
      prisma.package.findMany({
        where: { status: 'LOST' },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, trackingNumber: true, status: true, updatedAt: true },
      }),
      prisma.package.findMany({
        where: { status: { in: ['DAMAGED', 'RETURNED'] } },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, trackingNumber: true, status: true, updatedAt: true },
      }),
      prisma.delivery.findMany({
        where: { failedAt: { not: null } },
        orderBy: { failedAt: 'desc' },
        take: limit,
        include: { order: { select: { orderNumber: true } } },
      }),
      prisma.supportTicket.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: { in: ['HIGH', 'URGENT'] } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, ticketNumber: true, subject: true, status: true, priority: true, createdAt: true },
      }),
    ]);

    return ok(res, {
      failedOrders,
      lostPackages,
      exceptionPackages,
      failedDeliveries: failedDeliveries.map((d) => ({
        id: d.id,
        failureReason: d.failureReason,
        failedAt: d.failedAt,
        orderNumber: d.order.orderNumber,
      })),
      urgentTickets,
      totals: {
        failedOrders: failedOrders.length,
        lostPackages: lostPackages.length,
        exceptionPackages: exceptionPackages.length,
        failedDeliveries: failedDeliveries.length,
        urgentTickets: urgentTickets.length,
      },
    }, 'Exception center');
  }),

    paymentReconciliation: asyncHandler(async (_req: Request, res: Response) => {
    const [byStatus, pendingOrders, paidWithoutDelivery, deliveredUnpaid] = await Promise.all([
      prisma.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true, refundedAmount: true } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.payment.count({
        where: { status: 'PAID', order: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } },
      }),
      prisma.order.count({
        where: {
          status: 'DELIVERED',
          payment: { status: { notIn: ['PAID', 'PARTIALLY_REFUNDED'] } },
        },
      }),
    ]);

    return ok(res, {
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        amount: Number(r._sum.amount ?? 0),
        refunded: Number(r._sum.refundedAmount ?? 0),
      })),
      anomalies: {
        pendingPaymentOrders: pendingOrders,
        paidBeforeDelivery: paidWithoutDelivery,
        deliveredUnpaid,
      },
    }, 'Payment reconciliation');
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
