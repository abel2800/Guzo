import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/index.js';

export class BranchStaffService {
  async assign(userId: string, branchId: string) {
    const branch = await prisma.guzoBranch.findUnique({ where: { id: branchId } });
    if (!branch) throw ApiError.notFound('Branch not found');

    const role = await prisma.role.findFirst({ where: { name: ROLES.BRANCH_STAFF } });
    if (!role) throw ApiError.badRequest('BRANCH_STAFF role is not configured');

    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!existing) {
      await prisma.userRole.create({ data: { userId, roleId: role.id } });
    }

    return prisma.guzoBranchStaff.upsert({
      where: { userId_branchId: { userId, branchId } },
      create: { userId, branchId },
      update: {},
    });
  }

  async listByBranch(branchId: string) {
    return prisma.guzoBranchStaff.findMany({ where: { branchId } });
  }

  async myBranches(userId: string) {
    const rows = await prisma.guzoBranchStaff.findMany({
      where: { userId },
      include: { branch: true },
    });
    return rows.map((staff) => ({
      branchId: staff.branchId,
      assignedAt: staff.assignedAt,
      branch: staff.branch
        ? {
            id: staff.branch.id,
            code: staff.branch.code,
            name: staff.branch.name,
            city: staff.branch.city,
            line1: staff.branch.line1,
            phone: staff.branch.phone,
          }
        : null,
    }));
  }
}

export const branchStaffService = new BranchStaffService();
