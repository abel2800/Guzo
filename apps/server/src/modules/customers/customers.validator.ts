import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createCustomerValidator = [body().custom(() => true)];
export const updateCustomerValidator = [param('id').isString().notEmpty()];
