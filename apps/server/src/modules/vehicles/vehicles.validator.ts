import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isString().notEmpty()];

// Extend with concrete field rules as the vehicles contract solidifies.
export const createVehicleValidator = [body().custom(() => true)];
export const updateVehicleValidator = [param('id').isString().notEmpty()];
