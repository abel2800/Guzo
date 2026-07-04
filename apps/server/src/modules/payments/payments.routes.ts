import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { idParamValidator, createPaymentValidator, updatePaymentValidator } from './payments.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT', 'FINANCE'), paymentsController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT', 'FINANCE'), validate(idParamValidator), paymentsController.getById);
router.post('/', authorize('ADMIN'), validate(createPaymentValidator), paymentsController.create);
router.post('/:id/refund', authorize('ADMIN', 'FINANCE'), validate(idParamValidator), paymentsController.refund);
router.patch('/:id', authorize('ADMIN', 'FINANCE'), validate(updatePaymentValidator), paymentsController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), paymentsController.remove);

export default router;
