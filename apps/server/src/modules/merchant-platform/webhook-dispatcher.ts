import crypto from 'node:crypto';
import { prisma } from '@delivery/database';
import { hashApiKey } from './merchant-platform.service.js';

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function dispatchMerchantEvent(merchantId: string, eventType: string, payload: unknown): Promise<void> {
  const hooks = await prisma.merchantWebhook.findMany({ where: { merchantId, isActive: true } });
  if (!hooks.length) return;

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const now = new Date();

  await prisma.webhookDelivery.createMany({
    data: hooks.map((hook) => ({
      id: `wd_${randomHex(10)}`,
      webhookId: hook.id,
      eventType,
      payload: body,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
    })),
  });

  void processPendingDeliveries(merchantId);
}

export async function processPendingDeliveries(merchantId?: string): Promise<void> {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: 'PENDING',
      ...(merchantId ? { webhook: { merchantId } } : {}),
    },
    take: 20,
    orderBy: { createdAt: 'asc' },
    include: { webhook: true },
  });

  for (const row of pending) {
    try {
      const sig = crypto.createHmac('sha256', row.webhook.secret).update(row.payload).digest('hex');
      const res = await fetch(row.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guzo-Event': row.eventType,
          'X-Guzo-Signature': sig,
        },
        body: row.payload,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await prisma.webhookDelivery.update({
        where: { id: row.id },
        data: { status: 'DELIVERED', deliveredAt: new Date(), attempts: { increment: 1 } },
      });
    } catch (err) {
      await prisma.webhookDelivery.update({
        where: { id: row.id },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          lastError: err instanceof Error ? err.message : 'delivery failed',
        },
      });
    }
  }
}

export async function authenticateMerchantApiKey(rawKey: string): Promise<string> {
  const dot = rawKey.indexOf('.');
  if (dot <= 0) throw new Error('invalid key format');
  const prefix = rawKey.slice(0, dot);
  const key = await prisma.merchantApiKey.findFirst({ where: { keyPrefix: prefix, isActive: true } });
  if (!key) throw new Error('key not found');
  if (hashApiKey(rawKey) !== key.keyHash) throw new Error('key mismatch');
  await prisma.merchantApiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return key.merchantId;
}
