import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the permissions contract solidifies.
export const createPermissionValidator = [body().custom(() => true)];
export const updatePermissionValidator = [param('id').isString().notEmpty()];
