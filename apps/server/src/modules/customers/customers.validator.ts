import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the customers contract solidifies.
export const createCustomerValidator = [body().custom(() => true)];
export const updateCustomerValidator = [param('id').isString().notEmpty()];
