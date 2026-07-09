import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createPackageValidator = [body().custom(() => true)];
export const updatePackageValidator = [param('id').isString().notEmpty()];
