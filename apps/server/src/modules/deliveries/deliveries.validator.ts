import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createDeliveryValidator = [body().custom(() => true)];
export const updateDeliveryValidator = [param('id').isString().notEmpty()];
