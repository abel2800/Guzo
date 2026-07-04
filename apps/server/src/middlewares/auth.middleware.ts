import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';
import type { Role } from '@delivery/types';

/**
 * Authentication: validates the Bearer access token and attaches a fully
 * resolved principal (roles + flattened permissions) to req.user.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }
    const token = header.slice(7);
    const claims = verifyAccessToken(token);

    // Resolve roles + permissions fresh so revoked access takes effect quickly.
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('Account is not active');
    }

    const roles = user.roles.map((ur) => ur.role.name as Role);
    const permissions = Array.from(
      new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
    );

    req.user = {
      id: user.id,
      email: user.email,
      roles,
      permissions,
      sessionId: claims.sessionId,
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(ApiError.unauthorized('Invalid or expired access token'));
  }
}

/** Optional auth: attaches user if a valid token is present, never blocks. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    await authenticate(req, _res, () => undefined);
  } catch {
    /* ignore */
  }
  next();
}
