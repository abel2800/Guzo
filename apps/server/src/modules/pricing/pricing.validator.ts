import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createPricingRuleValidator = [body().custom(() => true)];
export const updatePricingRuleValidator = [param('id').isString().notEmpty()];
