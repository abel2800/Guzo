import { Router } from 'express';
import { vehiclesController } from './vehicles.controller.js';
import { idParamValidator, createVehicleValidator, updateVehicleValidator } from './vehicles.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), vehiclesController.list);
router.get('/:id', authorize('ADMIN'), validate(idParamValidator), vehiclesController.getById);
router.post('/', authorize('ADMIN'), validate(createVehicleValidator), vehiclesController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateVehicleValidator), vehiclesController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), vehiclesController.remove);

export default router;
