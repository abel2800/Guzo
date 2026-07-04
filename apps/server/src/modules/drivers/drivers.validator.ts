import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the drivers contract solidifies.
export const createDriverValidator = [body().custom(() => true)];
export const updateDriverValidator = [param('id').isString().notEmpty()];
