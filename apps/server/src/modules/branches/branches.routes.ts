import { Router } from 'express';
import { branchesController } from './branches.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { upload, uploadTo } from '../../middlewares/upload.middleware.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';

const router = Router();
router.use(authenticate);

const BRANCH_OPS = ['ADMIN', 'BRANCH_STAFF', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF'] as const;

router.get('/', authorize(...BRANCH_OPS, 'DRIVER'), branchesController.list);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), branchesController.create);
router.get('/:id/orders', authorize(...BRANCH_OPS), branchesController.orders);
router.get('/:id/stats', authorize(...BRANCH_OPS), branchesController.stats);
router.get('/:id/inventory', authorize(...BRANCH_OPS), branchesController.inventory);
router.get('/:id/shelf/:shelfCode', authorize(...BRANCH_OPS), branchesController.shelfLookup);
router.post('/:id/receive', authorize(...BRANCH_OPS), branchesController.receive);
router.post(
  '/:id/receive-intake',
  authorize(...BRANCH_OPS),
  uploadTo(UPLOAD_FOLDERS.PARCEL_IMAGES),
  upload.single('photo'),
  branchesController.receiveIntake,
);
router.post('/:id/register', authorize(...BRANCH_OPS), branchesController.register);
router.post('/:id/register-quote', authorize(...BRANCH_OPS), branchesController.registerQuote);
router.get('/:id/labels/:tracking', authorize(...BRANCH_OPS), branchesController.label);
router.post('/:id/shelf', authorize(...BRANCH_OPS), branchesController.assignShelf);
router.post('/:id/pickup', authorize(...BRANCH_OPS), branchesController.pickup);
router.post('/:id/exception', authorize(...BRANCH_OPS), branchesController.exception);
router.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), branchesController.update);
router.get('/:id', authorize(...BRANCH_OPS, 'DRIVER'), branchesController.get);

export default router;