import { Router } from 'express';
import { otpController } from './otp.controller.js';
import { sendOtpValidator, verifyOtpValidator } from './otp.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/send', authRateLimiter, validate(sendOtpValidator), otpController.send);
router.post('/verify', authRateLimiter, validate(verifyOtpValidator), otpController.verify);

export default router;
