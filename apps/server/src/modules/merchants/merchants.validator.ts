import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the merchants contract solidifies.
export const createMerchantValidator = [body().custom(() => true)];
export const updateMerchantValidator = [param('id').isString().notEmpty()];
