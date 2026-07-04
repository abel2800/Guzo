import { Router } from 'express';
import { rolesController } from './roles.controller.js';
import { idParamValidator, createRoleValidator, updateRoleValidator } from './roles.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), rolesController.list);
router.get('/:id', authorize('ADMIN'), validate(idParamValidator), rolesController.getById);
router.post('/', authorize('ADMIN'), validate(createRoleValidator), rolesController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateRoleValidator), rolesController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), rolesController.remove);

export default router;
