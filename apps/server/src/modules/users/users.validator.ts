import { body, param } from 'express-validator';

export const createUserValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('firstName').isString().trim().notEmpty(),
  body('lastName').isString().trim().notEmpty(),
  body('phone').optional().isString().trim(),
  body('roles').optional().isArray(),
];

export const updateUserValidator = [
  param('id').isString().notEmpty(),
  body('firstName').optional().isString().trim().notEmpty(),
  body('lastName').optional().isString().trim().notEmpty(),
  body('phone').optional().isString().trim(),
  body('status').optional().isIn(['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED']),
];

export const idParamValidator = [param('id').isString().notEmpty()];

export const assignRolesValidator = [
  param('id').isString().notEmpty(),
  body('roles').isArray({ min: 1 }).withMessage('roles must be a non-empty array'),
];
