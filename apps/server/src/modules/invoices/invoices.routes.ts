import { Router } from 'express';
import { param } from 'express-validator';
import { invoicesController } from './invoices.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const idParamValidator = [param('id').isString().notEmpty()];

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT', 'FINANCE', 'CUSTOMER', 'MERCHANT'), invoicesController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT', 'FINANCE'), validate(idParamValidator), invoicesController.getById);
router.patch('/:id', authorize('ADMIN', 'FINANCE'), validate(idParamValidator), invoicesController.updateStatus);

export default router;
