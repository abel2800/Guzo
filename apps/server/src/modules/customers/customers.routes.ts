import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { idParamValidator, createCustomerValidator, updateCustomerValidator } from './customers.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT'), customersController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT'), validate(idParamValidator), customersController.getById);
router.post('/', authorize('ADMIN'), validate(createCustomerValidator), customersController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateCustomerValidator), customersController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), customersController.remove);

export default router;
