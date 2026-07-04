import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the coupons contract solidifies.
export const createCouponValidator = [body().custom(() => true)];
export const updateCouponValidator = [param('id').isString().notEmpty()];
