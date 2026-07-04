import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { buildMeta } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { prisma } from '@delivery/database';

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = parseListQuery(req);
    const userId = req.user!.id;
    const unreadOnly = req.query.unread === 'true';
    const where = {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return ok(res, items, 'Notifications fetched', { ...buildMeta(query.page, query.limit, total), unreadCount });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const row = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!row || row.userId !== req.user!.id) throw ApiError.notFound('Notification not found');
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date(), status: 'READ' },
    });
    return ok(res, updated, 'Notification marked read');
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
    return ok(res, { success: true }, 'All notifications marked read');
  }),
};
