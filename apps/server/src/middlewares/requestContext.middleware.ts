import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

/** Attaches a unique request id (useful for tracing/log correlation). */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
