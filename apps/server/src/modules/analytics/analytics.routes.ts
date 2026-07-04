import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE', 'OPERATIONS_MANAGER'));

router.get('/orders-over-time', analyticsController.ordersOverTime);
router.get('/revenue-by-type', analyticsController.revenueByDeliveryType);
router.get('/top-drivers', analyticsController.topDrivers);

export default router;
