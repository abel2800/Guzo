import { Router } from 'express';
import { searchController } from './search.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'));

router.get('/', searchController.global);

export default router;
