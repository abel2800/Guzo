import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the reviews contract solidifies.
export const createReviewValidator = [body().custom(() => true)];
export const updateReviewValidator = [param('id').isString().notEmpty()];
