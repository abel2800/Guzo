import { Router } from 'express';
import { supportController } from './support.controller.js';
import {
  idParamValidator,
  createSupportTicketValidator,
  updateSupportTicketValidator,
  addMessageValidator,
} from './support.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', supportController.list);
router.post('/', validate(createSupportTicketValidator), supportController.create);
router.get('/:id', validate(idParamValidator), supportController.getById);
router.post('/:id/messages', validate(addMessageValidator), supportController.addMessage);

router.patch('/:id', authorize('ADMIN', 'SUPPORT'), validate(updateSupportTicketValidator), supportController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), supportController.remove);

export default router;
