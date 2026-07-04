import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import type { Role } from '@delivery/types';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: Role[];
  sessionId?: string;
  type: 'access';
}

export interface RefreshTokenClaims {
  sub: string;
  sessionId: string;
  type: 'refresh';
}

export function signAccessToken(claims: Omit<AccessTokenClaims, 'type'>): string {
  return jwt.sign({ ...claims, type: 'access' }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
}

export function signRefreshToken(claims: Omit<RefreshTokenClaims, 'type'>): string {
  return jwt.sign({ ...claims, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenClaims;
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenClaims;
}

/** Refresh tokens are stored only as a SHA-256 hash. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Convert an expiry like "7d"/"15m" into a future Date. */
export function expiryToDate(expiresIn: string): Date {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unit = match[2];
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return new Date(now + value * ms);
}
