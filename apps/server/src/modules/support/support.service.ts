import { supportRepository, SupportTicketRepository } from './support.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import type { CreateSupportTicketDto, UpdateSupportTicketDto, AddTicketMessageDto } from './support.dto.js';
import { generateReference } from '@delivery/utils';
import { emitToUser } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';

export interface TicketContext {
  userId: string;
  isAgent: boolean;
}

interface TicketRow {
  requesterId: string;
  assigneeId: string | null;
  ticketNumber: string;
  status: string;
}

export class SupportTicketService {
  constructor(private readonly repo: SupportTicketRepository = supportRepository) {}

  async list(
    query: ParsedListQuery,
    scope?: { requesterId?: string },
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { items, total } = await this.repo.list({
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.filters.status,
      priority: query.filters.priority,
      assigneeId: query.filters.assigneeId,
      requesterId: scope?.requesterId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string, ctx: TicketContext) {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    this.assertAccess(ticket, ctx);
    if (!ctx.isAgent) {
      return { ...ticket, messages: ticket.messages.filter((m) => !m.isInternal) };
    }
    return ticket;
  }

  async create(dto: CreateSupportTicketDto, userId: string) {
    const ticketNumber = generateReference('TIC');
    const ticket = await this.repo.create({
      ticketNumber,
      subject: dto.subject,
      category: dto.category,
      priority: dto.priority ?? 'MEDIUM',
      orderId: dto.orderId,
      requester: { connect: { id: userId } },
      ...(dto.message
        ? { messages: { create: [{ body: dto.message, author: { connect: { id: userId } } }] } }
        : {}),
    });
    return ticket;
  }

  async addMessage(id: string, dto: AddTicketMessageDto, ctx: TicketContext) {
    const ticket = (await this.repo.findById(id)) as (TicketRow & { id: string }) | null;
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    this.assertAccess(ticket, ctx);

    const isInternal = ctx.isAgent ? !!dto.isInternal : false;
    const message = await this.repo.addMessage({
      ticketId: id,
      authorId: ctx.userId,
      body: dto.body,
      isInternal,
    });

    if (!isInternal) {
      let nextStatus: string | undefined;
      if (ctx.isAgent && ticket.status === 'OPEN') nextStatus = 'IN_PROGRESS';
      if (!ctx.isAgent && ['RESOLVED', 'CLOSED', 'WAITING_CUSTOMER'].includes(ticket.status)) nextStatus = 'OPEN';
      await this.repo.touch(id, nextStatus ? { status: nextStatus as never } : {});

      const notifyUserId = ctx.isAgent ? ticket.requesterId : ticket.assigneeId;
      if (notifyUserId) {
        emitToUser(notifyUserId, SOCKET_EVENTS.NOTIFICATION_NEW, {
          type: 'SUPPORT_REPLY',
          title: `Ticket ${ticket.ticketNumber}`,
          body: ctx.isAgent ? 'Support replied to your ticket' : 'Customer replied to a ticket',
        });
      }
    }

    return message;
  }

  async update(id: string, dto: UpdateSupportTicketDto, ctx: TicketContext) {
    const ticket = (await this.repo.findById(id)) as (TicketRow & { id: string }) | null;
    if (!ticket) throw ApiError.notFound('Support ticket not found');

    const isResolving = dto.status === 'RESOLVED' || dto.status === 'CLOSED';
    const updated = await this.repo.update(id, {
      ...(dto.status ? { status: dto.status as never } : {}),
      ...(dto.priority ? { priority: dto.priority as never } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.assigneeId !== undefined
        ? dto.assigneeId
          ? { assignee: { connect: { id: dto.assigneeId } } }
          : { assignee: { disconnect: true } }
        : {}),
      ...(isResolving ? { resolvedAt: new Date() } : {}),
      ...(dto.status && !isResolving ? { resolvedAt: null } : {}),
    });

    if (dto.status && ticket.requesterId !== ctx.userId) {
      emitToUser(ticket.requesterId, SOCKET_EVENTS.NOTIFICATION_NEW, {
        type: 'SUPPORT_STATUS',
        title: `Ticket ${ticket.ticketNumber}`,
        body: `Your ticket is now ${dto.status}`,
      });
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    await this.repo.delete(id);
  }

  private assertAccess(ticket: { requesterId: string }, ctx: TicketContext) {
    if (!ctx.isAgent && ticket.requesterId !== ctx.userId) {
      throw ApiError.forbidden('You do not have access to this ticket');
    }
  }
}

export const supportService = new SupportTicketService();
