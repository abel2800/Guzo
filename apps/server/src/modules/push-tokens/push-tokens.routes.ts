import { Router } from 'express';
import { body } from 'express-validator';
import { pushTokensController } from './push-tokens.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  validate([
    body('token').isString().trim().notEmpty(),
    body('platform').isIn(['ios', 'android']),
    body('appSlug').isIn(['customer', 'driver', 'merchant', 'branch']),
  ]),
  pushTokensController.register,
);

router.delete(
  '/',
  validate([body('token').isString().trim().notEmpty()]),
  pushTokensController.remove,
);

export default router;
