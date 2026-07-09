import crypto from 'node:crypto';
import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';

export function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function resolveMerchantForUser(userId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) throw ApiError.badRequest('Authenticated user is not a merchant');
  return merchant;
}

export class MerchantPlatformService {
  async listApiKeys(merchantId: string) {
    return prisma.merchantApiKey.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async createApiKey(merchantId: string, label = 'default') {
    const prefix = `gz_${randomHex(4)}`;
    const secret = randomHex(16);
    const raw = `${prefix}.${secret}`;

    const key = await prisma.merchantApiKey.create({
      data: {
        merchantId,
        label,
        keyPrefix: prefix,
        keyHash: hashApiKey(raw),
      },
      select: { id: true, label: true, keyPrefix: true, createdAt: true },
    });

    return { ...key, apiKey: raw };
  }

  async revokeApiKey(merchantId: string, keyId: string) {
    const key = await prisma.merchantApiKey.findFirst({ where: { id: keyId, merchantId } });
    if (!key) throw ApiError.notFound('API key not found');
    return prisma.merchantApiKey.update({
      where: { id: keyId },
      data: { isActive: false },
      select: { id: true, label: true, keyPrefix: true, isActive: true },
    });
  }

  async listWebhooks(merchantId: string) {
    return prisma.merchantWebhook.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    });
  }

  async registerWebhook(merchantId: string, url: string, secret?: string) {
    if (!url?.trim()) throw ApiError.badRequest('url is required');
    const id = `wh_${randomHex(8)}`;
    return prisma.merchantWebhook.create({
      data: {
        id,
        merchantId,
        url: url.trim(),
        secret: secret?.trim() || randomHex(8),
      },
      select: { id: true, url: true, secret: true, events: true, isActive: true, createdAt: true },
    });
  }

  async setWebhookActive(merchantId: string, webhookId: string, isActive: boolean) {
    const hook = await prisma.merchantWebhook.findFirst({ where: { id: webhookId, merchantId } });
    if (!hook) throw ApiError.notFound('Webhook not found');
    return prisma.merchantWebhook.update({
      where: { id: webhookId },
      data: { isActive },
      select: { id: true, url: true, isActive: true },
    });
  }

  async listDeliveries(merchantId: string, limit = 20) {
    return prisma.webhookDelivery.findMany({
      where: { webhook: { merchantId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { webhook: { select: { url: true } } },
    });
  }

  async listCustomers(merchantId: string) {
    const orders = await prisma.order.findMany({
      where: { merchantId },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        dropoffAddress: {
          select: { contactName: true, contactPhone: true, line1: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const map = new Map<string, {
      contactName: string | null;
      contactPhone: string | null;
      line1: string;
      city: string;
      orderCount: number;
      lastOrderAt: string;
    }>();

    for (const o of orders) {
      const phone = o.dropoffAddress.contactPhone?.trim() || o.dropoffAddress.line1;
      const existing = map.get(phone);
      if (existing) {
        existing.orderCount += 1;
        if (o.createdAt > new Date(existing.lastOrderAt)) existing.lastOrderAt = o.createdAt.toISOString();
      } else {
        map.set(phone, {
          contactName: o.dropoffAddress.contactName,
          contactPhone: o.dropoffAddress.contactPhone,
          line1: o.dropoffAddress.line1,
          city: o.dropoffAddress.city,
          orderCount: 1,
          lastOrderAt: o.createdAt.toISOString(),
        });
      }
    }

    return [...map.values()].sort((a, b) => b.orderCount - a.orderCount);
  }
}

export const merchantPlatformService = new MerchantPlatformService();
