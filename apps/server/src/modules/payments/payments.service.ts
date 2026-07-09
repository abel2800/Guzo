import { prisma } from '@delivery/database';
import { paymentsRepository, PaymentRepository } from './payments.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import type { CreatePaymentDto, UpdatePaymentDto, RefundPaymentDto } from './payments.dto.js';
import { paymentProvider } from '../../providers/payment/index.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { emitToAdmins } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';

const round = (n: number) => Math.round(n * 100) / 100;

export class PaymentService {
  constructor(private readonly repo: PaymentRepository = paymentsRepository) {}

  async list(query: ParsedListQuery): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const { items, total } = await this.repo.list({
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.filters.status,
      method: query.filters.method,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string): Promise<unknown> {
    const item = await this.repo.findById(id);
    if (!item) throw ApiError.notFound('Payment not found');
    return item;
  }

  create(dto: CreatePaymentDto) {
    return this.repo.create(dto as never);
  }

  async update(id: string, dto: UpdatePaymentDto) {
    await this.getById(id);
    return this.repo.update(id, dto as never);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
  }

  async refund(id: string, dto: RefundPaymentDto) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (!['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
      throw ApiError.badRequest('Only paid payments can be refunded');
    }

    const total = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundedAmount);
    const remaining = round(total - alreadyRefunded);
    if (remaining <= 0) throw ApiError.badRequest('This payment is already fully refunded');

    const amount = dto.amount != null ? round(dto.amount) : remaining;
    if (amount <= 0) throw ApiError.badRequest('Refund amount must be positive');
    if (amount > remaining) throw ApiError.badRequest(`Refund exceeds remaining balance (${remaining})`);

    const result = await paymentProvider.refund({
      providerRef: payment.providerRef ?? payment.reference,
      amount,
      reason: dto.reason,
    });
    if (result.status !== 'REFUNDED') throw ApiError.badRequest('Refund was declined by the provider');

    const newRefunded = round(alreadyRefunded + amount);
    const fullyRefunded = newRefunded >= total;

    const updated = await this.repo.update(id, {
      refundedAmount: newRefunded,
      status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      metadata: {
        ...(typeof payment.metadata === 'object' && payment.metadata ? payment.metadata : {}),
        lastRefund: { amount, reason: dto.reason ?? null, at: new Date().toISOString() },
      },
    });

    if (fullyRefunded) {
      await prisma.invoice.updateMany({ where: { orderId: payment.orderId }, data: { status: 'VOID' } });
    }

    eventBus.publish(DOMAIN_EVENTS.PAYMENT_REFUNDED, { paymentId: id, orderId: payment.orderId, amount });
    emitToAdmins(SOCKET_EVENTS.NOTIFICATION_NEW, {
      type: 'PAYMENT_REFUNDED',
      title: 'Refund issued',
      body: `${payment.currency} ${amount} refunded on ${payment.reference}`,
    });

    return updated;
  }
}

export const paymentsService = new PaymentService();
