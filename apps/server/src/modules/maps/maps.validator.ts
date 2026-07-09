import { query } from 'express-validator';

export const routeQueryValidator = [
  query('fromLat').isFloat({ min: -90, max: 90 }),
  query('fromLng').isFloat({ min: -180, max: 180 }),
  query('toLat').isFloat({ min: -90, max: 90 }),
  query('toLng').isFloat({ min: -180, max: 180 }),
  query('via').optional().isString(),
];

export const geocodeQueryValidator = [
  query('q').isString().trim().notEmpty().isLength({ min: 3, max: 300 }),
];
