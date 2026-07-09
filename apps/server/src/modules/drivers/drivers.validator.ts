import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createDriverValidator = [body().custom(() => true)];
export const updateDriverValidator = [param('id').isString().notEmpty()];
