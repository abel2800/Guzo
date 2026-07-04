import { Router } from 'express';
import { deliveriesController } from './deliveries.controller.js';
import { idParamValidator, createDeliveryValidator, updateDeliveryValidator } from './deliveries.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT', 'DRIVER'), deliveriesController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT', 'DRIVER'), validate(idParamValidator), deliveriesController.getById);
router.post('/', authorize('ADMIN', 'DRIVER'), validate(createDeliveryValidator), deliveriesController.create);
router.patch('/:id', authorize('ADMIN', 'DRIVER'), validate(updateDeliveryValidator), deliveriesController.update);
router.delete('/:id', authorize('ADMIN', 'DRIVER'), validate(idParamValidator), deliveriesController.remove);

export default router;
