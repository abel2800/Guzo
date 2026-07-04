import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the deliveries contract solidifies.
export const createDeliveryValidator = [body().custom(() => true)];
export const updateDeliveryValidator = [param('id').isString().notEmpty()];
