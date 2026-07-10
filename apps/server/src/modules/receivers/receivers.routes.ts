import { Router } from 'express';
import { receiversController } from './receivers.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/lookup', authenticate, receiversController.lookup);

export default router;
