import { prisma } from '@delivery/database';
import { invoicesRepository, InvoiceRepository } from './invoices.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';

export class InvoiceService {
  constructor(private readonly repo: InvoiceRepository = invoicesRepository) {}

  async list(
    query: ParsedListQuery,
    scope?: { customerUserId?: string; merchantUserId?: string },
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    let customerId: string | undefined;
    let merchantId: string | undefined;

    if (scope?.customerUserId) {
      const customer = await prisma.customer.findUnique({ where: { userId: scope.customerUserId } });
      customerId = customer?.id ?? '__no_customer__';
    }
    if (scope?.merchantUserId) {
      const merchant = await prisma.merchant.findUnique({ where: { userId: scope.merchantUserId } });
      merchantId = merchant?.id ?? '__no_merchant__';
    }

    const { items, total } = await this.repo.list({
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.filters.status,
      customerId,
      merchantId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async getById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw ApiError.notFound('Invoice not found');
    return item;
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    await this.getById(id);
    return this.repo.update(id, {
      status: status as never,
      ...(status === 'PAID' ? { paidAt: new Date() } : {}),
    });
  }
}

export const invoicesService = new InvoiceService();
