import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createSettingValidator = [body().custom(() => true)];
export const updateSettingValidator = [param('id').isString().notEmpty()];
