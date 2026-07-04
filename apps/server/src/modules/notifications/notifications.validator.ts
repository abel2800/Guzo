import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the notifications contract solidifies.
export const createNotificationValidator = [body().custom(() => true)];
export const updateNotificationValidator = [param('id').isString().notEmpty()];
