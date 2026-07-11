import { Router } from 'express';
import { body } from 'express-validator';
import { familyController } from './family.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/:ownerUserId', familyController.list);
router.post(
  '/link',
  validate([
    body('ownerUserId').isString().trim().notEmpty(),
    body('memberUserId').isString().trim().notEmpty(),
    body('relation').optional().isString(),
    body('label').optional().isString(),
  ]),
  familyController.link,
);

export default router;
