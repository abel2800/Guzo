import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createPaymentValidator = [body().custom(() => true)];
export const updatePaymentValidator = [param('id').isString().notEmpty()];
