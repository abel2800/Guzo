import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the packages contract solidifies.
export const createPackageValidator = [body().custom(() => true)];
export const updatePackageValidator = [param('id').isString().notEmpty()];
