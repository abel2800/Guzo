import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

const jsonHandler = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => unknown } }) =>
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests, please try again later.',
    errorCode: ERROR_CODES.RATE_LIMITED,
  });

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler as never,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler as never,
});
