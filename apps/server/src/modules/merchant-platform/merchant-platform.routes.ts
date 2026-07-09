import { Router } from 'express';
import { merchantPlatformController } from './merchant-platform.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('MERCHANT'));

router.get('/keys', merchantPlatformController.listKeys);
router.post('/keys', merchantPlatformController.createKey);
router.delete('/keys/:id', merchantPlatformController.revokeKey);

router.get('/webhooks', merchantPlatformController.listWebhooks);
router.post('/webhooks', merchantPlatformController.registerWebhook);
router.patch('/webhooks/:id', merchantPlatformController.updateWebhook);
router.get('/webhooks/deliveries', merchantPlatformController.listDeliveries);
router.post('/webhooks/test', merchantPlatformController.testEvent);

router.get('/customers', merchantPlatformController.listCustomers);

export default router;
