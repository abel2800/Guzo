import { Router } from 'express';
import { pricingController } from './pricing.controller.js';
import { idParamValidator, createPricingRuleValidator, updatePricingRuleValidator } from './pricing.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), pricingController.list);
router.get('/:id', authorize('ADMIN'), validate(idParamValidator), pricingController.getById);
router.post('/', authorize('ADMIN'), validate(createPricingRuleValidator), pricingController.create);
router.patch('/:id', authorize('ADMIN'), validate(updatePricingRuleValidator), pricingController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), pricingController.remove);

export default router;
