import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/summary', adminController.summary);
router.get('/audit-logs', adminController.auditLogs);
router.get('/activity-logs', adminController.activityLogs);
router.get('/exceptions', adminController.exceptions);
router.get('/payments/reconciliation', adminController.paymentReconciliation);
router.post('/drivers/:id/approve', adminController.approveDriver);
router.post('/drivers/:id/reject', adminController.rejectDriver);
router.get('/drivers/live', adminController.liveDrivers);
router.get('/drivers/:id/detail', adminController.driverDetail);
router.get('/approvals/pending', adminController.pendingApprovals);
router.post('/users/:id/approve', adminController.approveUser);
router.get('/users/:id/detail', adminController.userDetail);

export default router;
