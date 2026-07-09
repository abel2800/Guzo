import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createWarehouseValidator = [body().custom(() => true)];
export const updateWarehouseValidator = [param('id').isString().notEmpty()];
