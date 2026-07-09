import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { authenticateMerchantApiKey } from './webhook-dispatcher.js';

declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
    }
  }
}

export async function merchantApiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('Authorization') ?? req.header('X-Api-Key');
    const raw = header?.replace(/^Bearer\s+/i, '').trim();
    if (!raw) return next(ApiError.unauthorized('API key required'));
    req.merchantId = await authenticateMerchantApiKey(raw);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid API key'));
  }
}
