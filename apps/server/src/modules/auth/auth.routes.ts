import { Router } from 'express';
import { authController } from './auth.controller.js';
import {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
  updateProfileLocationValidator,
} from './auth.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware.js';
import { upload, uploadTo } from '../../middlewares/upload.middleware.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerValidator), authController.register);
router.post('/login', authRateLimiter, validate(loginValidator), authController.login);
router.post('/refresh', validate(refreshValidator), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(updateProfileValidator), authController.updateProfile);
router.patch('/me/location', authenticate, validate(updateProfileLocationValidator), authController.updateLocation);
router.patch('/me/password', authenticate, validate(changePasswordValidator), authController.changePassword);
router.post(
  '/me/avatar',
  authenticate,
  uploadTo(UPLOAD_FOLDERS.AVATARS),
  upload.single('avatar'),
  authController.uploadAvatar,
);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidator), authController.resetPassword);

export default router;
