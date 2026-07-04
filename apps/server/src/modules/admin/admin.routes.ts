import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/summary', adminController.summary);
router.get('/audit-logs', adminController.auditLogs);
router.get('/activity-logs', adminController.activityLogs);
router.post('/drivers/:id/approve', adminController.approveDriver);
router.post('/drivers/:id/reject', adminController.rejectDriver);

export default router;
