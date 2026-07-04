import jwt from 'jsonwebtoken';
import type { Role } from '@delivery/types';
import { authRepository, AuthRepository } from './auth.repository.js';
import { AUTH_MESSAGES, DEFAULT_REGISTER_ROLE } from './auth.constants.js';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RequestContext,
} from './auth.dto.js';
import type { LoginResponse } from './auth.types.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  expiryToDate,
} from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { generateReference } from '@delivery/utils';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { emailProvider } from '../../providers/notification/email.provider.js';

type UserWithRoles = NonNullable<Awaited<ReturnType<AuthRepository['findUserById']>>>;

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async register(dto: RegisterDto, ctx: RequestContext): Promise<LoginResponse> {
    const existing = await this.repo.findUserByEmail(dto.email);
    if (existing) throw ApiError.conflict(AUTH_MESSAGES.EMAIL_TAKEN);

    const roleName = dto.role ?? DEFAULT_REGISTER_ROLE;
    const role = await this.repo.getRoleByName(roleName);
    if (!role) throw ApiError.badRequest(`Role ${roleName} is not configured. Run db:seed.`);

    const passwordHash = await hashPassword(dto.password);

    // Create profile row matching the chosen role.
    const profile =
      roleName === 'MERCHANT'
        ? { merchant: { create: { merchantCode: generateReference('MER'), businessName: `${dto.firstName} ${dto.lastName}` } } }
        : roleName === 'DRIVER'
          ? { driver: { create: { driverCode: generateReference('DRV') } } }
          : { customer: { create: { customerCode: generateReference('CUST') } } };

    const user = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: 'ACTIVE',
      roles: { create: [{ role: { connect: { id: role.id } } }] },
      ...profile,
    });

    eventBus.publish(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, {
      userId: user.id,
      type: 'WELCOME',
      title: 'Welcome to Delivery Platform',
      body: `Hi ${user.firstName}, your account is ready.`,
    });

    return this.issueSession(user, ctx);
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<LoginResponse> {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) throw ApiError.unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized(AUTH_MESSAGES.INVALID_CREDENTIALS);
    if (user.status !== 'ACTIVE') throw ApiError.forbidden('Account is not active');

    await this.repo.updateLastLogin(user.id);
    return this.issueSession(user, ctx);
  }

  async refresh(refreshToken: string, ctx: RequestContext): Promise<LoginResponse> {
    let claims: { sub: string; sessionId: string };
    try {
      claims = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.repo.findRefreshTokenByHash(tokenHash);
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token is no longer valid');
    }

    const user = await this.repo.findUserById(claims.sub);
    if (!user || user.status !== 'ACTIVE') throw ApiError.unauthorized('Account is not active');

    // Rotate: revoke old token, issue a new one in the same session.
    const session = stored.sessionId ?? undefined;
    const result = await this.issueSession(user, ctx, session);
    await this.repo.revokeRefreshToken(stored.id);
    return result;
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const stored = await this.repo.findRefreshTokenByHash(hashToken(refreshToken));
      if (stored) {
        await this.repo.revokeRefreshToken(stored.id);
        if (stored.sessionId) await this.repo.revokeSession(stored.sessionId);
      }
    } catch {
      /* best-effort */
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.repo.findUserByEmail(dto.email);
    // Always behave the same to avoid user enumeration.
    if (user) {
      const resetToken = jwt.sign({ sub: user.id, purpose: 'reset' }, env.jwt.accessSecret, {
        expiresIn: '30m',
      });
      const link = `${env.publicUrl}/reset-password?token=${resetToken}`;
      await emailProvider.send({
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click to reset your password (valid 30 min):</p><p><a href="${link}">${link}</a></p>`,
      });
    }
    return { message: AUTH_MESSAGES.RESET_SENT };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let payload: { sub: string; purpose: string };
    try {
      payload = jwt.verify(dto.token, env.jwt.accessSecret) as { sub: string; purpose: string };
    } catch {
      throw ApiError.badRequest('Reset token is invalid or expired');
    }
    if (payload.purpose !== 'reset') throw ApiError.badRequest('Invalid reset token');

    const passwordHash = await hashPassword(dto.password);
    await this.repo.updatePassword(payload.sub, passwordHash);
    return { message: AUTH_MESSAGES.PASSWORD_RESET };
  }

  getMe(userId: string) {
    return this.repo.findUserById(userId).then((user) => {
      if (!user) throw ApiError.notFound('User not found');
      return this.toAuthUser(user);
    });
  }

  // ---- helpers ----

  private async issueSession(
    user: UserWithRoles,
    ctx: RequestContext,
    existingSessionId?: string,
  ): Promise<LoginResponse> {
    const roles = user.roles.map((ur) => ur.role.name as Role);

    let sessionId = existingSessionId;
    if (!sessionId) {
      const session = await this.repo.createSession({
        userId: user.id,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
        expiresAt: expiryToDate(env.jwt.refreshExpiresIn),
      });
      sessionId = session.id;
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, roles, sessionId });
    const refreshToken = signRefreshToken({ sub: user.id, sessionId });

    await this.repo.createRefreshToken({
      userId: user.id,
      sessionId,
      tokenHash: hashToken(refreshToken),
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
      expiresAt: expiryToDate(env.jwt.refreshExpiresIn),
    });

    return {
      user: this.toAuthUser(user),
      tokens: { accessToken, refreshToken, expiresIn: 15 * 60 },
    };
  }

  private toAuthUser(user: UserWithRoles) {
    const roles = user.roles.map((ur) => ur.role.name as Role);
    const permissions = Array.from(
      new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
    );
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
    };
  }
}

export const authService = new AuthService();
