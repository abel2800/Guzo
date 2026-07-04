import { body, param } from 'express-validator';

export const orderIdParamValidator = [param('orderId').isString().notEmpty()];

export const recordLocationValidator = [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('orderId').optional().isString(),
  body('deliveryId').optional().isString(),
  body('speed').optional().isFloat(),
  body('heading').optional().isFloat(),
];
