import { Router } from 'express';
import { searchController } from './search.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPPORT'));

router.get('/', searchController.global);

export default router;
