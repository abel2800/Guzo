import { Router } from 'express';
import { authController } from './auth.controller.js';
import {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from './auth.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerValidator), authController.register);
router.post('/login', authRateLimiter, validate(loginValidator), authController.login);
router.post('/refresh', validate(refreshValidator), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidator), authController.resetPassword);

export default router;
