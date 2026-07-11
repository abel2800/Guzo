import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';

export class FamilyService {
  async listForOwner(ownerUserId: string) {
    const rows = await prisma.familyMember.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            customer: { select: { customerCode: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      memberUserId: row.memberUserId,
      relation: row.relation,
      label: row.label,
      member: {
        firstName: row.member.firstName,
        lastName: row.member.lastName,
        phone: row.member.phone,
        guzoId: row.member.customer?.customerCode ?? row.memberUserId,
      },
    }));
  }

  async link(ownerUserId: string, memberUserId: string, relation: string, label?: string) {
    if (ownerUserId === memberUserId) {
      throw ApiError.badRequest('Cannot link yourself as a family member');
    }

    const [owner, member] = await Promise.all([
      prisma.user.findUnique({ where: { id: ownerUserId } }),
      prisma.user.findUnique({ where: { id: memberUserId } }),
    ]);
    if (!owner || !member) throw ApiError.notFound('User not found');

    const existing = await prisma.familyMember.findUnique({
      where: { ownerUserId_memberUserId: { ownerUserId, memberUserId } },
    });
    if (existing) throw ApiError.conflict('Family member already linked');

    const row = await prisma.familyMember.create({
      data: {
        ownerUserId,
        memberUserId,
        relation: (relation?.toUpperCase() || 'OTHER') as never,
        label: label?.trim() || null,
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            customer: { select: { customerCode: true } },
          },
        },
      },
    });

    return {
      id: row.id,
      memberUserId: row.memberUserId,
      relation: row.relation,
      label: row.label,
      member: {
        firstName: row.member.firstName,
        lastName: row.member.lastName,
        phone: row.member.phone,
        guzoId: row.member.customer?.customerCode ?? row.memberUserId,
      },
    };
  }
}

export const familyService = new FamilyService();
