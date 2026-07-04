import { Router } from 'express';
import { merchantsController } from './merchants.controller.js';
import { idParamValidator, createMerchantValidator, updateMerchantValidator } from './merchants.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT'), merchantsController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT'), validate(idParamValidator), merchantsController.getById);
router.post('/', authorize('ADMIN'), validate(createMerchantValidator), merchantsController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateMerchantValidator), merchantsController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), merchantsController.remove);

export default router;
