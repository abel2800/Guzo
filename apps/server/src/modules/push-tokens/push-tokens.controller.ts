import type { Request, Response } from 'express';
import { prisma } from '@delivery/database';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, noContent } from '../../utils/ApiResponse.js';

export const pushTokensController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { token, platform, appSlug } = req.body as { token: string; platform: string; appSlug: string };

    const device = await prisma.pushDevice.upsert({
      where: { token },
      create: { userId, token, platform, appSlug },
      update: { userId, platform, appSlug, updatedAt: new Date() },
    });

    return ok(res, device, 'Push token registered');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { token } = req.body as { token: string };
    await prisma.pushDevice.deleteMany({ where: { token, userId } });
    return noContent(res);
  }),
};
