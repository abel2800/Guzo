import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/admin', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'), dashboardController.admin);
router.get('/customer', authorize('CUSTOMER'), dashboardController.customer);
router.get('/support', authorize('SUPPORT', 'ADMIN'), dashboardController.support);
router.get('/merchant', authorize('MERCHANT'), dashboardController.merchant);
router.get('/warehouse', authorize('WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), dashboardController.warehouse);
router.get('/finance', authorize('FINANCE', 'ADMIN'), dashboardController.finance);
router.get('/driver', authorize('DRIVER'), dashboardController.driver);

export default router;
