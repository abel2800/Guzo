import { Router } from 'express';
import { cityZonesController } from './city-zones.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/', cityZonesController.list);
router.get('/:id', cityZonesController.getById);
router.post('/', cityZonesController.create);
router.patch('/:id', cityZonesController.update);
router.delete('/:id', cityZonesController.remove);

export default router;
