import { Router } from 'express';
import { manifestsController } from './manifests.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

const WH_OPS = ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'OPERATIONS_MANAGER'] as const;

router.get('/live-trucks', authorize(...WH_OPS), manifestsController.liveTrucks);
router.get('/', authorize(...WH_OPS), manifestsController.list);
router.get('/:id/unload-status', authorize(...WH_OPS), manifestsController.unloadStatus);
router.get('/:id', authorize(...WH_OPS), manifestsController.detail);
router.post('/', authorize(...WH_OPS), manifestsController.create);
router.post('/:id/scan', authorize(...WH_OPS), manifestsController.scan);
router.post('/:id/depart', authorize(...WH_OPS), manifestsController.depart);
router.post('/:id/arrive', authorize(...WH_OPS), manifestsController.arrive);
router.post('/:id/unload', authorize(...WH_OPS), manifestsController.unload);

export default router;
