import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { AUTH_MESSAGES } from './auth.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';

function ctx(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body, ctx(req));
    return created(res, result, AUTH_MESSAGES.REGISTERED);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, ctx(req));
    return ok(res, result, AUTH_MESSAGES.LOGGED_IN);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken, ctx(req));
    return ok(res, result, AUTH_MESSAGES.TOKEN_REFRESHED);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken ?? '');
    return ok(res, null, AUTH_MESSAGES.LOGGED_OUT);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    return ok(res, user, 'Current user');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body);
    return ok(res, null, result.message);
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    return ok(res, null, result.message);
  }),
};
