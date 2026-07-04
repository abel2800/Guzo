import { Router } from 'express';
import { body, param } from 'express-validator';
import { addressesController } from './addresses.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

const addressBody = [
  body('line1').isString().trim().notEmpty(),
  body('city').isString().trim().notEmpty(),
  body('label').optional().isString(),
  body('contactName').optional().isString(),
  body('contactPhone').optional().isString(),
  body('isDefault').optional().isBoolean(),
];

router.get('/', addressesController.list);
router.post('/', validate(addressBody), addressesController.create);
router.patch('/:id', validate([param('id').isString().notEmpty()]), addressesController.update);
router.delete('/:id', validate([param('id').isString().notEmpty()]), addressesController.remove);

export default router;
