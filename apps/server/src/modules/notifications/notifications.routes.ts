import { Router } from 'express';
import { param } from 'express-validator';
import { notificationsController } from './notifications.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', notificationsController.list);
router.post('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', validate([param('id').isString().notEmpty()]), notificationsController.markRead);

export default router;
