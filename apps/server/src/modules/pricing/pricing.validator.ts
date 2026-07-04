import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the pricing contract solidifies.
export const createPricingRuleValidator = [body().custom(() => true)];
export const updatePricingRuleValidator = [param('id').isString().notEmpty()];
