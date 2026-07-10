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

const emailOrPhone = () =>
  body().custom((_value, { req }) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    if (!email && !phone) throw new Error('Email or phone number is required');
    if (email && phone) throw new Error('Provide email or phone, not both');
    return true;
  });

export const registerValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  password(),
  body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
  body('phone').isString().trim().isLength({ min: 9 }).withMessage('A valid phone number is required'),
  body('role').optional().isIn(['CUSTOMER', 'MERCHANT', 'DRIVER', 'BRANCH_STAFF']).withMessage('Invalid role'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'),
];

export const forgotPasswordValidator = [
  body('email').optional().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('phone').optional().isString().trim().isLength({ min: 9 }).withMessage('Enter a valid phone number'),
  emailOrPhone(),
];

export const resetPasswordValidator = [
  body('token').optional().isString(),
  body('email').optional().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('phone').optional().isString().trim().isLength({ min: 9 }).withMessage('Enter a valid phone number'),
  body().custom((_value, { req }) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (token) return true;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    if (!email && !phone) throw new Error('Email or phone number is required');
    if (email && phone) throw new Error('Provide email or phone, not both');
    return true;
  }),
  password(),
];

export const updateProfileValidator = [
  body('firstName').optional().isString().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().isString().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional({ nullable: true }).isString().trim(),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']).withMessage('Invalid gender'),
];

export const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('New password must contain a letter')
    .matches(/\d/)
    .withMessage('New password must contain a number'),
];

export const updateProfileLocationValidator = [
  body('label').optional().isString().trim(),
  body('line1').isString().trim().notEmpty().withMessage('Street address is required'),
  body('line2').optional().isString().trim(),
  body('city').isString().trim().notEmpty().withMessage('City is required'),
  body('state').optional().isString().trim(),
  body('postalCode').optional().isString().trim(),
  body('country').optional().isString().trim(),
];
