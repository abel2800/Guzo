import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';
import { ApiError, type FieldError } from '../utils/ApiError.js';

export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await Promise.all(chains.map((chain) => chain.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors: FieldError[] = result.array().map((e) => ({
      field: e.type === 'field' ? e.path : 'unknown',
      message: e.msg,
    }));
    next(ApiError.validation(errors));
  };
}
