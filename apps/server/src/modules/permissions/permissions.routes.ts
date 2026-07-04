import { Router } from 'express';
import { permissionsController } from './permissions.controller.js';
import { idParamValidator, createPermissionValidator, updatePermissionValidator } from './permissions.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), permissionsController.list);
router.get('/:id', authorize('ADMIN'), validate(idParamValidator), permissionsController.getById);
router.post('/', authorize('ADMIN'), validate(createPermissionValidator), permissionsController.create);
router.patch('/:id', authorize('ADMIN'), validate(updatePermissionValidator), permissionsController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), permissionsController.remove);

export default router;
