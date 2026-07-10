import { prisma, type Prisma } from '@delivery/database';

export interface UserListParams {
  skip: number;
  take: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export class UsersRepository {
  async list(params: UserListParams) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status as Prisma.EnumUserStatusFilter['equals'] } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = params.sortBy
      ? { [params.sortBy]: params.sortOrder }
      : { createdAt: params.sortOrder };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: { roles: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: { roles: { include: { role: true } } } });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: { roles: { include: { role: true } } },
    });
  }

  softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }

  rolesByNames(names: string[]) {
    return prisma.role.findMany({ where: { name: { in: names } } });
  }

  async replaceRoles(userId: string, roleIds: string[]) {
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });
    return this.findById(userId);
  }

  approveLinkedProfiles(userId: string) {
    return prisma.$transaction([
      prisma.driver.updateMany({
        where: { userId },
        data: { approvalStatus: 'APPROVED', approvedAt: new Date() },
      }),
      prisma.merchant.updateMany({
        where: { userId },
        data: { isVerified: true },
      }),
    ]);
  }
}

export const usersRepository = new UsersRepository();
