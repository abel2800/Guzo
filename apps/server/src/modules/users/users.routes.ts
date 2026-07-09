import { Router } from 'express';
import { usersController } from './users.controller.js';
import {
  createUserValidator,
  updateUserValidator,
  idParamValidator,
  assignRolesValidator,
} from './users.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT'), usersController.list);
router.post('/', authorize('ADMIN'), validate(createUserValidator), usersController.create);
router.get('/:id', authorize('ADMIN', 'SUPPORT'), validate(idParamValidator), usersController.getById);
router.patch('/:id', authorize('ADMIN'), validate(updateUserValidator), usersController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), usersController.remove);
router.put('/:id/roles', authorize('ADMIN'), validate(assignRolesValidator), usersController.assignRoles);

export default router;
