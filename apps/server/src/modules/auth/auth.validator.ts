import { body } from 'express-validator';

const password = () =>
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

export const registerValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  password(),
  body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString().trim(),
  body('role').optional().isIn(['CUSTOMER', 'MERCHANT', 'DRIVER']).withMessage('Invalid role'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').isString().notEmpty().withMessage('token is required'),
  password(),
];
