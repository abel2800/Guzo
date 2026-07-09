import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createRoleValidator = [body().custom(() => true)];
export const updateRoleValidator = [param('id').isString().notEmpty()];
