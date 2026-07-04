import { Router } from 'express';
import { couponsController } from './coupons.controller.js';
import { idParamValidator, createCouponValidator, updateCouponValidator } from './coupons.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), couponsController.list);
router.get('/:id', authorize('ADMIN'), validate(idParamValidator), couponsController.getById);
router.post('/', authorize('ADMIN'), validate(createCouponValidator), couponsController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateCouponValidator), couponsController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), couponsController.remove);

export default router;
