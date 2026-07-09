import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createVehicleValidator = [body().custom(() => true)];
export const updateVehicleValidator = [param('id').isString().notEmpty()];
