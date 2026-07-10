import jwt from 'jsonwebtoken';
import type { LoginResponse, RegisterResponse, Role, UserProfile } from '@delivery/types';
import { authRepository, AuthRepository } from './auth.repository.js';
import { AUTH_MESSAGES, DEFAULT_REGISTER_ROLE, APPROVAL_REGISTER_ROLES, PENDING_APPROVAL_MESSAGE } from './auth.constants.js';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateProfileLocationDto,
  RequestContext,
} from './auth.dto.js';
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
import { storage } from '../../providers/storage/index.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';
import { otpService } from '../otp/otp.service.js';
import {
  findUserByPhoneVariants,
  isWalkInEmail,
  linkOrdersToCustomerAccount,
  upgradeWalkInCustomer,
} from '../customers/customer-link.service.js';
import { normalizePhone } from '../../utils/phone.js';

type UserWithRoles = NonNullable<Awaited<ReturnType<AuthRepository['findUserById']>>>;
type AddressRow = NonNullable<Awaited<ReturnType<AuthRepository['findDefaultAddressOrFirst']>>>;

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async register(dto: RegisterDto, ctx: RequestContext): Promise<RegisterResponse> {
    const existing = await this.repo.findUserByEmail(dto.email);
    if (existing) throw ApiError.conflict(AUTH_MESSAGES.EMAIL_TAKEN);

    if (dto.phone?.trim()) {
      await otpService.assertRecentlyVerified(dto.phone);
    }

    const roleName = (dto.role ?? DEFAULT_REGISTER_ROLE) as Role;
    const role = await this.repo.getRoleByName(roleName);
    if (!role) throw ApiError.badRequest(`Role ${roleName} is not configured. Run db:seed.`);

    if (dto.phone?.trim() && roleName === 'CUSTOMER') {
      const phoneUser = await findUserByPhoneVariants(dto.phone);
      if (phoneUser && !isWalkInEmail(phoneUser.email)) {
        throw ApiError.conflict('This phone number is already registered. Sign in instead.');
      }
      if (phoneUser && isWalkInEmail(phoneUser.email)) {
        const passwordHash = await hashPassword(dto.password);
        const upgraded = await upgradeWalkInCustomer({
          walkInUserId: phoneUser.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        });
        await linkOrdersToCustomerAccount(upgraded.id, dto.phone);
        eventBus.publish(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, {
          userId: upgraded.id,
          type: 'WELCOME',
          title: 'Welcome to Delivery Platform',
          body: `Hi ${upgraded.firstName}, your account is ready.`,
        });
        return this.issueSession(upgraded, ctx);
      }
    }

    const needsApproval = APPROVAL_REGISTER_ROLES.has(roleName);
    const passwordHash = await hashPassword(dto.password);

    const profile =
      roleName === 'MERCHANT'
        ? { merchant: { create: { merchantCode: generateReference('MER'), businessName: `${dto.firstName} ${dto.lastName}` } } }
        : roleName === 'DRIVER'
          ? {
              driver: {
                create: {
                  driverCode: generateReference('DRV'),
                  approvalStatus: (needsApproval ? 'PENDING' : 'APPROVED') as 'PENDING' | 'APPROVED',
                },
              },
            }
          : roleName === 'CUSTOMER'
            ? { customer: { create: { customerCode: generateReference('CUST') } } }
            : {};

    const user = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ? normalizePhone(dto.phone) : undefined,
      status: needsApproval ? 'PENDING' : 'ACTIVE',
      roles: { create: [{ role: { connect: { id: role.id } } }] },
      ...profile,
    });

    if (dto.phone?.trim() && roleName === 'CUSTOMER') {
      await linkOrdersToCustomerAccount(user.id, dto.phone);
    }

    if (needsApproval) {
      eventBus.publish(DOMAIN_EVENTS.NOTIFICATION_REQUESTED, {
        userId: user.id,
        type: 'ACCOUNT_PENDING',
        title: 'Registration submitted',
        body: PENDING_APPROVAL_MESSAGE,
      });
      return {
        pending: true,
        message: PENDING_APPROVAL_MESSAGE,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles.map((ur) => ur.role.name as Role),
        },
      };
    }

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
    if (user.status === 'PENDING') throw ApiError.forbidden(PENDING_APPROVAL_MESSAGE);
    if (user.status !== 'ACTIVE') throw ApiError.forbidden('Account is not active');

    await this.repo.updateLastLogin(user.id);
    if (user.roles.some((ur) => ur.role.name === 'CUSTOMER') && user.phone) {
      await linkOrdersToCustomerAccount(user.id, user.phone);
    }
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
    } catch {}
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; phone?: string }> {
    const user = await this.resolveUserForPasswordReset(dto);
    if (user?.phone) {
      const sent = await otpService.send(user.phone);
      return { message: AUTH_MESSAGES.RESET_OTP_SENT, phone: sent.phone };
    }
    return { message: AUTH_MESSAGES.RESET_SENT };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.token?.trim()) {
      return this.resetPasswordWithToken(dto.token.trim(), dto.password);
    }

    const user = await this.resolveUserForPasswordReset(dto);
    if (!user) throw ApiError.badRequest('Unable to reset password for this account');
    if (!user.phone) {
      throw ApiError.badRequest('This account has no phone number on file. Contact support.');
    }

    await otpService.assertRecentlyVerified(user.phone);
    const passwordHash = await hashPassword(dto.password);
    await this.repo.updatePassword(user.id, passwordHash);
    return { message: AUTH_MESSAGES.PASSWORD_RESET };
  }

  private async resetPasswordWithToken(token: string, password: string): Promise<{ message: string }> {
    let payload: { sub: string; purpose: string };
    try {
      payload = jwt.verify(token, env.jwt.accessSecret) as { sub: string; purpose: string };
    } catch {
      throw ApiError.badRequest('Reset token is invalid or expired');
    }
    if (payload.purpose !== 'reset') throw ApiError.badRequest('Invalid reset token');

    const passwordHash = await hashPassword(password);
    await this.repo.updatePassword(payload.sub, passwordHash);
    return { message: AUTH_MESSAGES.PASSWORD_RESET };
  }

  private async resolveUserForPasswordReset(dto: ForgotPasswordDto) {
    const email = dto.email?.trim();
    const phone = dto.phone?.trim();
    if (email) return this.repo.findUserByEmail(email);
    if (phone) return findUserByPhoneVariants(phone);
    return null;
  }

  getMe(userId: string): Promise<UserProfile> {
    return this.repo.findUserById(userId).then(async (user) => {
      if (!user) throw ApiError.notFound('User not found');
      if (user.roles.some((ur) => ur.role.name === 'CUSTOMER') && user.phone) {
        await linkOrdersToCustomerAccount(userId, user.phone);
      }
      const defaultAddress = await this.repo.findDefaultAddressOrFirst(userId);
      return this.toUserProfile(user, defaultAddress);
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.repo.updateProfile(userId, {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone ? normalizePhone(dto.phone) : null } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
    });
    if (dto.phone?.trim()) {
      await linkOrdersToCustomerAccount(userId, dto.phone);
    }
    const defaultAddress = await this.repo.findDefaultAddressOrFirst(userId);
    return this.toUserProfile(user, defaultAddress);
  }

  async updateLocation(userId: string, dto: UpdateProfileLocationDto): Promise<UserProfile> {
    const existing = await this.repo.findDefaultAddressOrFirst(userId);
    if (existing) {
      await this.repo.clearDefaultAddresses(userId);
      await this.repo.updateAddress(existing.id, {
        label: dto.label ?? existing.label ?? 'Primary',
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country ?? existing.country ?? 'ET',
        isDefault: true,
      });
    } else {
      await this.repo.createAddress({
        userId,
        label: dto.label ?? 'Primary',
        type: 'HOME',
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country ?? 'ET',
        isDefault: true,
      });
    }
    return this.getMe(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');
    const valid = await comparePassword(dto.currentPassword, user.passwordHash);
    if (!valid) throw ApiError.badRequest('Current password is incorrect');
    const passwordHash = await hashPassword(dto.newPassword);
    await this.repo.updatePassword(userId, passwordHash);
    return { message: AUTH_MESSAGES.PASSWORD_CHANGED };
  }

  async uploadAvatar(
    userId: string,
    file: { path: string; filename: string; originalname: string; mimetype: string; size: number },
  ): Promise<UserProfile> {
    const saved = await storage.save({
      absolutePath: file.path,
      folder: UPLOAD_FOLDERS.AVATARS,
      filename: file.filename,
    });
    const fileRow = await this.repo.createFile({
      uploaderId: userId,
      category: 'AVATAR',
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey: saved.storageKey,
      storageDriver: saved.driver,
    });
    const user = await this.repo.updateProfile(userId, { avatar: { connect: { id: fileRow.id } } });
    const defaultAddress = await this.repo.findDefaultAddressOrFirst(userId);
    return this.toUserProfile(user, defaultAddress);
  }

  
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
      phone: user.phone,
      gender: user.gender,
      avatarUrl: this.avatarUrl(user),
      roles,
      permissions,
    };
  }

  private toUserProfile(user: UserWithRoles, defaultAddress: AddressRow | null): UserProfile {
    return {
      ...this.toAuthUser(user),
      createdAt: user.createdAt.toISOString(),
      defaultAddress: defaultAddress
        ? {
            id: defaultAddress.id,
            label: defaultAddress.label,
            line1: defaultAddress.line1,
            line2: defaultAddress.line2,
            city: defaultAddress.city,
            state: defaultAddress.state,
            postalCode: defaultAddress.postalCode,
            country: defaultAddress.country,
            isDefault: defaultAddress.isDefault,
          }
        : null,
    };
  }

  private avatarUrl(user: UserWithRoles) {
    if (!user.avatar?.storageKey) return null;
    return `${env.publicUrl}/static/${user.avatar.storageKey.replace(/^uploads\//, '')}`;
  }
}

export const authService = new AuthService();
