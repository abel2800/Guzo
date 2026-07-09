import { Router } from 'express';
import { branchStaffController } from './branch-staff.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/me', authorize('ADMIN', 'BRANCH_STAFF', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), branchStaffController.me);
router.post('/', authorize('ADMIN'), branchStaffController.assign);
router.get('/branch/:branchId', authorize('ADMIN'), branchStaffController.listByBranch);

export default router;
