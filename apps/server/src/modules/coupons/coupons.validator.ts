import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createCouponValidator = [body().custom(() => true)];
export const updateCouponValidator = [param('id').isString().notEmpty()];
