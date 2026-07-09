import { Router } from 'express';
import { trackingController } from './tracking.controller.js';
import { orderIdParamValidator, recordLocationValidator } from './tracking.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.get('/:orderId/timeline', optionalAuth, validate(orderIdParamValidator), trackingController.timeline);

router.use(authenticate);
router.post('/location', authorize('DRIVER'), validate(recordLocationValidator), trackingController.recordLocation);
router.get('/me/history', authorize('DRIVER'), trackingController.history);

export default router;
