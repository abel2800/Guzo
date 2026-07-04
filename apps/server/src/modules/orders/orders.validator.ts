import { body, param } from 'express-validator';

const addr = (prefix: string) => [
  body(`${prefix}.line1`).isString().trim().notEmpty().withMessage(`${prefix}.line1 is required`),
  body(`${prefix}.city`).isString().trim().notEmpty().withMessage(`${prefix}.city is required`),
  body(`${prefix}.latitude`).optional().isFloat({ min: -90, max: 90 }),
  body(`${prefix}.longitude`).optional().isFloat({ min: -180, max: 180 }),
];

export const createOrderValidator = [
  body('deliveryType').optional().isIn(['STANDARD', 'EXPRESS', 'SAME_DAY', 'SCHEDULED', 'INTERNATIONAL']),
  ...addr('pickup'),
  ...addr('dropoff'),
  body('package.weightKg').isFloat({ min: 0 }).withMessage('package.weightKg must be >= 0'),
  body('package.declaredValue').optional().isFloat({ min: 0 }),
  body('couponCode').optional().isString().trim(),
];

export const idParamValidator = [param('id').isString().notEmpty()];

export const updateStatusValidator = [
  param('id').isString().notEmpty(),
  body('status')
    .isIn([
      'CONFIRMED',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'AT_WAREHOUSE',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'CANCELLED',
      'RETURNED',
    ])
    .withMessage('Invalid status'),
  body('latitude').optional().isFloat(),
  body('longitude').optional().isFloat(),
];

export const assignDriverValidator = [
  param('id').isString().notEmpty(),
  body('driverId').isString().notEmpty(),
  body('vehicleId').optional().isString(),
];
