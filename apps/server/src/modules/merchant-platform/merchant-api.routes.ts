import { Router } from 'express';
import { merchantApiKeyAuth } from './merchant-api-key.middleware.js';
import { merchantPlatformService } from './merchant-platform.service.js';
import { dispatchMerchantEvent } from './webhook-dispatcher.js';
import { ordersService } from '../orders/orders.service.js';
import { createOrderValidator } from '../orders/orders.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();
router.use(merchantApiKeyAuth);

router.post('/orders', validate(createOrderValidator), asyncHandler(async (req, res) => {
  if (!req.merchantId) throw ApiError.unauthorized();
  const order = await ordersService.createForMerchantId(req.merchantId, req.body);
  return created(res, order, 'Merchant order created');
}));

router.post('/keys', asyncHandler(async (req, res) => {
  if (!req.merchantId) throw ApiError.unauthorized();
  const item = await merchantPlatformService.createApiKey(req.merchantId, req.body?.label);
  return created(res, item, 'API key created');
}));

router.post('/webhooks', asyncHandler(async (req, res) => {
  if (!req.merchantId) throw ApiError.unauthorized();
  const item = await merchantPlatformService.registerWebhook(req.merchantId, req.body?.url, req.body?.secret);
  return created(res, item, 'Webhook registered');
}));

router.post('/events/test', asyncHandler(async (req, res) => {
  if (!req.merchantId) throw ApiError.unauthorized();
  await dispatchMerchantEvent(
    req.merchantId,
    req.body?.eventType ?? 'parcel.status_changed',
    req.body?.payload ?? { test: true },
  );
  return ok(res, { queued: true }, 'Event queued');
}));

export default router;
