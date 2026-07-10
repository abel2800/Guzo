import { Router } from 'express';
import { driversController } from './drivers.controller.js';
import { idParamValidator, createDriverValidator, updateDriverValidator } from './drivers.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { upload, uploadTo } from '../../middlewares/upload.middleware.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';

const router = Router();
router.use(authenticate);

router.get('/me/route', authorize('DRIVER'), driversController.myRoute);
router.get('/me/manifests', authorize('DRIVER'), driversController.myManifests);
router.get('/me/earnings', authorize('DRIVER'), driversController.myEarnings);
router.get('/me/vehicle', authorize('DRIVER'), driversController.myVehicle);
router.put('/me/vehicle', authorize('DRIVER'), driversController.upsertMyVehicle);
router.post(
  '/me/vehicle/photo',
  authorize('DRIVER'),
  uploadTo(UPLOAD_FOLDERS.VEHICLE_PHOTOS),
  upload.single('photo'),
  driversController.uploadVehiclePhoto,
);
router.get('/me/vehicle/logs', authorize('DRIVER'), driversController.myVehicleLogs);
router.post('/me/vehicle/logs', authorize('DRIVER'), driversController.createVehicleLog);
router.get('/me/manifests/:manifestId', authorize('DRIVER'), driversController.myManifestDetail);
router.post('/me/manifests/:manifestId/scan', authorize('DRIVER'), driversController.scanMyManifest);
router.post('/me/manifests/:manifestId/depart', authorize('DRIVER'), driversController.departMyManifest);
router.post('/me/manifests/:manifestId/arrive', authorize('DRIVER'), driversController.arriveMyManifest);
router.post('/me/manifests/:manifestId/unload', authorize('DRIVER'), driversController.unloadMyManifest);

router.get('/', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'), driversController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT', 'OPERATIONS_MANAGER'), validate(idParamValidator), driversController.getById);
router.post('/', authorize('ADMIN'), validate(createDriverValidator), driversController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateDriverValidator), driversController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), driversController.remove);

export default router;
