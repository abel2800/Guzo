import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';

export class InsuranceClaimsService {
  async list(query: ParsedListQuery, customerUserId?: string) {
    let customerId: string | undefined;
    if (customerUserId) {
      const c = await prisma.customer.findUnique({ where: { userId: customerUserId } });
      customerId = c?.id ?? '__none__';
    }

    const where = customerId ? { customerId } : {};
    const [items, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNumber: true, hasInsurance: true, insuranceAmount: true } } },
      }),
      prisma.insuranceClaim.count({ where }),
    ]);
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async create(userId: string, body: { orderId: string; description?: string; amountClaimed?: number }) {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw ApiError.badRequest('Customer profile required');

    const order = await prisma.order.findFirst({
      where: { id: body.orderId, customerId: customer.id },
    });
    if (!order) throw ApiError.notFound('Order not found');
    if (!order.hasInsurance) throw ApiError.badRequest('Order has no insurance coverage');

    const existing = await prisma.insuranceClaim.findUnique({ where: { orderId: order.id } });
    if (existing) throw ApiError.conflict('Claim already submitted for this order');

    return prisma.insuranceClaim.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        description: body.description,
        amountClaimed: body.amountClaimed ?? Number(order.insuranceAmount ?? 0),
      },
      include: { order: { select: { orderNumber: true } } },
    });
  }

  async updateStatus(id: string, status: string, resolutionNote?: string) {
    const allowed = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'];
    if (!allowed.includes(status)) throw ApiError.badRequest('Invalid status');
    return prisma.insuranceClaim.update({
      where: { id },
      data: { status: status as never, resolutionNote },
    });
  }
}

export const insuranceClaimsService = new InsuranceClaimsService();
