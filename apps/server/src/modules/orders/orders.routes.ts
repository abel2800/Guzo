import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import {
  createOrderValidator,
  idParamValidator,
  updateStatusValidator,
  assignDriverValidator,
} from './orders.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { upload, uploadTo } from '../../middlewares/upload.middleware.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';

const router = Router();

router.post('/quote', validate(createOrderValidator), ordersController.quote);
router.get('/track/:reference', optionalAuth, ordersController.track);

router.use(authenticate);

router.get('/', ordersController.list);
router.post('/', validate(createOrderValidator), ordersController.create);
router.post('/bulk', authorize('MERCHANT', 'ADMIN'), ordersController.createBulk);
router.get('/:id', validate(idParamValidator), ordersController.getById);
router.patch('/:id/status', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER', 'DRIVER', 'WAREHOUSE_STAFF'), validate(updateStatusValidator), ordersController.updateStatus);
router.post('/:id/assign', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'), validate(assignDriverValidator), ordersController.assignDriver);
router.post('/:id/accept', authorize('DRIVER'), validate(idParamValidator), ordersController.accept);

router.post(
  '/:id/pod',
  authorize('DRIVER'),
  uploadTo(UPLOAD_FOLDERS.PROOF_OF_DELIVERY),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ]),
  ordersController.submitProof,
);
router.post(
  '/:id/pickup-proof',
  authorize('DRIVER'),
  uploadTo(UPLOAD_FOLDERS.PARCEL_IMAGES),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ]),
  ordersController.submitPickupProof,
);
router.post('/:id/branch-handoff', authorize('DRIVER'), validate(idParamValidator), ordersController.branchHandoff);
router.post('/:id/scan-pickup', authorize('DRIVER'), validate(idParamValidator), ordersController.scanPickup);
router.post('/:id/arrived', authorize('DRIVER'), validate(idParamValidator), ordersController.notifyArrived);
router.post('/:id/failed', authorize('DRIVER'), validate(idParamValidator), ordersController.markFailed);
router.post('/:id/reattempt', authorize('DRIVER'), validate(idParamValidator), ordersController.reattempt);
router.post('/:id/cancel', validate(idParamValidator), ordersController.cancel);

export default router;
