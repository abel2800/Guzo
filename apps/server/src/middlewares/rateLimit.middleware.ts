import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { getRedis } from '../config/redis.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

const jsonHandler = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => unknown } }) =>
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests, please try again later.',
    errorCode: ERROR_CODES.RATE_LIMITED,
  });

function limiterOpts(windowMs: number, max: number) {
  const redis = getRedis();
  return {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonHandler as never,
    ...(redis
      ? {
          store: {
            init: () => {},
            increment: async (key: string) => {
              const count = await redis.incr(`rl:${key}`);
              if (count === 1) await redis.expire(`rl:${key}`, Math.ceil(windowMs / 1000));
              return { totalHits: count, resetTime: new Date(Date.now() + windowMs) };
            },
            decrement: async (key: string) => {
              await redis.decr(`rl:${key}`);
            },
            resetKey: async (key: string) => {
              await redis.del(`rl:${key}`);
            },
          },
        }
      : {}),
  };
}

export const globalRateLimiter = rateLimit(limiterOpts(env.rateLimit.windowMs, env.rateLimit.max));

export const authRateLimiter = rateLimit(limiterOpts(15 * 60 * 1000, 20));
