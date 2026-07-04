import { prisma, type Prisma } from '@delivery/database';

const paymentInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      merchantId: true,
      customer: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  },
} satisfies Prisma.PaymentInclude;

export interface PaymentListParams {
  skip: number;
  take: number;
  search?: string;
  status?: string;
  method?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export class PaymentRepository {
  async list(params: PaymentListParams) {
    const where: Prisma.PaymentWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumPaymentStatusFilter['equals'] } : {}),
      ...(params.method ? { method: params.method as Prisma.EnumPaymentMethodFilter['equals'] } : {}),
      ...(params.search
        ? {
            OR: [
              { reference: { contains: params.search, mode: 'insensitive' } },
              { providerRef: { contains: params.search, mode: 'insensitive' } },
              { order: { orderNumber: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.PaymentOrderByWithRelationInput = params.sortBy
      ? { [params.sortBy]: params.sortOrder }
      : { createdAt: params.sortOrder };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({ where, skip: params.skip, take: params.take, orderBy, include: paymentInclude }),
      prisma.payment.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  }

  create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data, include: paymentInclude });
  }

  update(id: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.update({ where: { id }, data, include: paymentInclude });
  }

  delete(id: string) {
    return prisma.payment.delete({ where: { id } });
  }
}

export const paymentsRepository = new PaymentRepository();
