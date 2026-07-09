import type { Request, Response } from 'express';
import { merchantPlatformService, resolveMerchantForUser } from './merchant-platform.service.js';
import { dispatchMerchantEvent } from './webhook-dispatcher.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

export const merchantPlatformController = {
  listKeys: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const items = await merchantPlatformService.listApiKeys(merchant.id);
    return ok(res, items, 'API keys loaded');
  }),

  createKey: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const item = await merchantPlatformService.createApiKey(merchant.id, req.body?.label);
    return created(res, item, 'API key created — store the secret now');
  }),

  revokeKey: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const item = await merchantPlatformService.revokeApiKey(merchant.id, req.params.id);
    return ok(res, item, 'API key revoked');
  }),

  listWebhooks: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const items = await merchantPlatformService.listWebhooks(merchant.id);
    return ok(res, items, 'Webhooks loaded');
  }),

  registerWebhook: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const item = await merchantPlatformService.registerWebhook(merchant.id, req.body?.url, req.body?.secret);
    return created(res, item, 'Webhook registered');
  }),

  updateWebhook: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    if (typeof req.body?.isActive !== 'boolean') throw ApiError.badRequest('isActive boolean required');
    const item = await merchantPlatformService.setWebhookActive(merchant.id, req.params.id, req.body.isActive);
    return ok(res, item, 'Webhook updated');
  }),

  listDeliveries: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const items = await merchantPlatformService.listDeliveries(merchant.id);
    return ok(res, items, 'Webhook deliveries loaded');
  }),

  testEvent: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const eventType = req.body?.eventType ?? 'parcel.status_changed';
    const payload = req.body?.payload ?? { test: true, merchantId: merchant.id };
    await dispatchMerchantEvent(merchant.id, eventType, payload);
    return ok(res, { queued: true }, 'Test event queued');
  }),

  listCustomers: asyncHandler(async (req: Request, res: Response) => {
    const merchant = await resolveMerchantForUser(req.user!.id);
    const items = await merchantPlatformService.listCustomers(merchant.id);
    return ok(res, items, 'Merchant customers loaded');
  }),
};
