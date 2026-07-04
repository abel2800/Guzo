import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the warehouses contract solidifies.
export const createWarehouseValidator = [body().custom(() => true)];
export const updateWarehouseValidator = [param('id').isString().notEmpty()];
