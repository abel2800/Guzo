import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createPermissionValidator = [body().custom(() => true)];
export const updatePermissionValidator = [param('id').isString().notEmpty()];
