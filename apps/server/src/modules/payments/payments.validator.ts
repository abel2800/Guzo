import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the payments contract solidifies.
export const createPaymentValidator = [body().custom(() => true)];
export const updatePaymentValidator = [param('id').isString().notEmpty()];
