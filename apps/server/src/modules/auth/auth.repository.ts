import { prisma, type Prisma } from '@delivery/database';

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        avatar: true,
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
  }

  findDefaultAddress(userId: string) {
    return prisma.address.findFirst({
      where: { userId, isDefault: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  updateProfile(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        avatar: true,
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
  }

  createFile(data: Prisma.FileUncheckedCreateInput) {
    return prisma.file.create({ data });
  }

  clearDefaultAddresses(userId: string) {
    return prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  findDefaultAddressOrFirst(userId: string) {
    return prisma.address.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  createAddress(data: Prisma.AddressUncheckedCreateInput) {
    return prisma.address.create({ data });
  }

  updateAddress(id: string, data: Prisma.AddressUpdateInput) {
    return prisma.address.update({ where: { id }, data });
  }

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        avatar: true,
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
        avatar: true,
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
