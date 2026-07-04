import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the settings contract solidifies.
export const createSettingValidator = [body().custom(() => true)];
export const updateSettingValidator = [param('id').isString().notEmpty()];
