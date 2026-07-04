import { Router } from 'express';
import { packagesController } from './packages.controller.js';
import { idParamValidator, createPackageValidator, updatePackageValidator } from './packages.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'SUPPORT'), packagesController.list);
router.get('/:id', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'SUPPORT'), validate(idParamValidator), packagesController.getById);
router.post('/', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), validate(createPackageValidator), packagesController.create);
router.patch('/:id', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), validate(updatePackageValidator), packagesController.update);
router.delete('/:id', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), validate(idParamValidator), packagesController.remove);

export default router;
