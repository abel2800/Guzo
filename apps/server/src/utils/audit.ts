import { prisma } from '@delivery/database';

export interface AuditParams {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAudit(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before as object | undefined,
      after: params.after as object | undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
