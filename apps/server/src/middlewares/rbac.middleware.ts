import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import type { Role } from '@delivery/types';
import { ROLES } from '../constants/index.js';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.roles.includes(ROLES.SUPER_ADMIN as Role)) return next();
    const has = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!has) return next(ApiError.forbidden('You do not have the required role'));
    next();
  };
}

export function authorizePermission(...required: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.roles.includes(ROLES.SUPER_ADMIN as Role)) return next();
    const has = required.every((p) => req.user!.permissions.includes(p));
    if (!has) return next(ApiError.forbidden('You do not have the required permission'));
    next();
  };
}
