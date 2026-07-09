import { prisma } from '@delivery/database';

export interface ActivityParams {
  userId?: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeActivity(params: ActivityParams): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      metadata: params.metadata as object | undefined,
      ipAddress: params.ipAddress,
    },
  });
}
