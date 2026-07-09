import { Router } from 'express';
import { warehousesController } from './warehouses.controller.js';
import { idParamValidator, createWarehouseValidator, updateWarehouseValidator } from './warehouses.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

const WH_OPS = ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'] as const;

router.get('/', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), warehousesController.list);

router.get('/:id/inventory', authorize(...WH_OPS), validate(idParamValidator), warehousesController.inventory);
router.get('/:id/stats', authorize(...WH_OPS), validate(idParamValidator), warehousesController.stats);
router.post('/:id/receive', authorize(...WH_OPS), validate(idParamValidator), warehousesController.receive);
router.post('/:id/sort', authorize(...WH_OPS), validate(idParamValidator), warehousesController.sort);
router.post('/:id/dispatch', authorize(...WH_OPS), validate(idParamValidator), warehousesController.dispatch);
router.get('/:id/inventory/by-city', authorize(...WH_OPS), validate(idParamValidator), warehousesController.inventoryByCity);
router.get('/:id/aging', authorize(...WH_OPS), validate(idParamValidator), warehousesController.aging);
router.post('/:id/transfer', authorize(...WH_OPS), validate(idParamValidator), warehousesController.transfer);

router.get('/:id', authorize('ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'), validate(idParamValidator), warehousesController.getById);
router.post('/', authorize('ADMIN'), validate(createWarehouseValidator), warehousesController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateWarehouseValidator), warehousesController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), warehousesController.remove);

export default router;
