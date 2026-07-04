import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'MERCHANT', 'FINANCE', 'OPERATIONS_MANAGER'));

router.get('/orders', reportsController.orders);
router.get('/deliveries', reportsController.deliveries);

export default router;
