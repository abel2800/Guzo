import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createReviewValidator = [body().custom(() => true)];
export const updateReviewValidator = [param('id').isString().notEmpty()];
