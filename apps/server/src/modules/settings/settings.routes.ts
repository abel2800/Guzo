import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { idParamValidator, createSettingValidator, updateSettingValidator } from './settings.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), settingsController.list);
router.get('/:id', authorize('ADMIN'), validate(idParamValidator), settingsController.getById);
router.post('/', authorize('ADMIN'), validate(createSettingValidator), settingsController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateSettingValidator), settingsController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), settingsController.remove);

export default router;
