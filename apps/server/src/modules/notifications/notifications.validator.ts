import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createNotificationValidator = [body().custom(() => true)];
export const updateNotificationValidator = [param('id').isString().notEmpty()];
