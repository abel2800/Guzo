import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createMerchantValidator = [body().custom(() => true)];
export const updateMerchantValidator = [param('id').isString().notEmpty()];
