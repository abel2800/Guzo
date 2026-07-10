import { body } from 'express-validator';

export const sendOtpValidator = [
  body('phone').isString().trim().isLength({ min: 9 }).withMessage('A valid phone number is required'),
];

export const verifyOtpValidator = [
  body('phone').isString().trim().isLength({ min: 9 }).withMessage('A valid phone number is required'),
  body('code').isString().trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code'),
];
