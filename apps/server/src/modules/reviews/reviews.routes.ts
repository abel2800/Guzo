import { Router } from 'express';
import { reviewsController } from './reviews.controller.js';
import { idParamValidator, createReviewValidator, updateReviewValidator } from './reviews.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPPORT'), reviewsController.list);
router.get('/:id', authorize('ADMIN', 'SUPPORT'), validate(idParamValidator), reviewsController.getById);
router.post('/', authorize('ADMIN'), validate(createReviewValidator), reviewsController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateReviewValidator), reviewsController.update);
router.delete('/:id', authorize('ADMIN'), validate(idParamValidator), reviewsController.remove);

export default router;
