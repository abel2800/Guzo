import { Router } from 'express';
import { loyaltyController } from './loyalty.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('CUSTOMER'));

router.get('/me', loyaltyController.me);
router.post('/referral', loyaltyController.applyReferral);

export default router;
