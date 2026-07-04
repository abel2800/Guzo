import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the roles contract solidifies.
export const createRoleValidator = [body().custom(() => true)];
export const updateRoleValidator = [param('id').isString().notEmpty()];
