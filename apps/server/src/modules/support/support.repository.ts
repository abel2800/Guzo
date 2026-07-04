import { prisma, type Prisma } from '@delivery/database';

const ticketInclude = {
  requester: { select: { id: true, email: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies Prisma.SupportTicketInclude;

export interface TicketListParams {
  skip: number;
  take: number;
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  requesterId?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export class SupportTicketRepository {
  async list(params: TicketListParams) {
    const where: Prisma.SupportTicketWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumTicketStatusFilter['equals'] } : {}),
      ...(params.priority ? { priority: params.priority as Prisma.EnumTicketPriorityFilter['equals'] } : {}),
      ...(params.assigneeId ? { assigneeId: params.assigneeId } : {}),
      ...(params.requesterId ? { requesterId: params.requesterId } : {}),
      ...(params.search
        ? {
            OR: [
              { ticketNumber: { contains: params.search, mode: 'insensitive' } },
              { subject: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.SupportTicketOrderByWithRelationInput = params.sortBy
      ? { [params.sortBy]: params.sortOrder }
      : { createdAt: params.sortOrder };

    const [items, total] = await Promise.all([
      prisma.supportTicket.findMany({ where, skip: params.skip, take: params.take, orderBy, include: ticketInclude }),
      prisma.supportTicket.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.supportTicket.findUnique({ where: { id }, include: ticketInclude });
  }

  create(data: Prisma.SupportTicketCreateInput) {
    return prisma.supportTicket.create({ data, include: ticketInclude });
  }

  update(id: string, data: Prisma.SupportTicketUpdateInput) {
    return prisma.supportTicket.update({ where: { id }, data, include: ticketInclude });
  }

  delete(id: string) {
    return prisma.supportTicket.delete({ where: { id } });
  }

  addMessage(data: Prisma.TicketMessageUncheckedCreateInput) {
    return prisma.ticketMessage.create({
      data,
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  /** Bumps updatedAt so the ticket surfaces at the top of the queue after a reply. */
  touch(id: string, data: Prisma.SupportTicketUpdateInput = {}) {
    return prisma.supportTicket.update({ where: { id }, data, include: ticketInclude });
  }
}

export const supportRepository = new SupportTicketRepository();
