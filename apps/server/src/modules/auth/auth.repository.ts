import { prisma, type Prisma } from '@delivery/database';

/**
 * Repository: the ONLY place that talks to the database for auth concerns.
 * Services depend on this, never on Prisma directly. Swapping the data source
 * later (read replicas, sharding) is isolated here.
 */
export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
  }

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
  }

  getRoleByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  }

  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  updateLastLogin(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  createSession(data: Prisma.SessionUncheckedCreateInput) {
    return prisma.session.create({ data });
  }

  createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return prisma.refreshToken.create({ data });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  revokeRefreshToken(id: string, replacedBy?: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date(), replacedBy },
    });
  }

  revokeSession(sessionId: string) {
    return prisma.session.update({ where: { id: sessionId }, data: { isRevoked: true } });
  }
}

export const authRepository = new AuthRepository();
