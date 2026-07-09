import { Router } from 'express';
import { insuranceClaimsController } from './insurance-claims.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('CUSTOMER', 'ADMIN', 'FINANCE', 'SUPPORT'), insuranceClaimsController.list);
router.post('/', authorize('CUSTOMER'), insuranceClaimsController.create);
router.patch('/:id/status', authorize('ADMIN', 'FINANCE'), insuranceClaimsController.updateStatus);

export default router;
