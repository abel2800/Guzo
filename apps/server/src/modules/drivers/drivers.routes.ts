import { Router } from 'express';
import { driversController } from './drivers.controller.js';
import { idParamValidator, createDriverValidator, updateDriverValidator } from './drivers.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'), driversController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'), validate(idParamValidator), driversController.getById);
router.post('/', authorize('ADMIN'), validate(createDriverValidator), driversController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateDriverValidator), driversController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), driversController.remove);

export default router;
