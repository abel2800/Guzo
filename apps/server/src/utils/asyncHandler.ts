import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers so rejected promises are forwarded to the global
 * error middleware instead of crashing the process. Removes repetitive
 * try/catch in every controller.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
