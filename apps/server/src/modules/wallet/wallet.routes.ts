import { Router } from 'express';
import { body } from 'express-validator';
import { walletController } from './wallet.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const topUpValidator = [
  body('amount').isFloat({ min: 0.01 }),
  body('description').optional().isString().trim(),
];

const router = Router();
router.use(authenticate, authorize('CUSTOMER', 'MERCHANT'));

router.get('/', walletController.summary);
router.get('/transactions', walletController.transactions);
router.post('/top-up', validate(topUpValidator), walletController.topUp);

export default router;
