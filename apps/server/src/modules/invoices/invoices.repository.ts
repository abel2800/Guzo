import { prisma, type Prisma } from '@delivery/database';

const invoiceInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      merchantId: true,
      customer: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  },
} satisfies Prisma.InvoiceInclude;

export interface InvoiceListParams {
  skip: number;
  take: number;
  search?: string;
  status?: string;
  customerId?: string;
  merchantId?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export class InvoiceRepository {
  async list(params: InvoiceListParams) {
    const where: Prisma.InvoiceWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumInvoiceStatusFilter['equals'] } : {}),
      ...(params.customerId ? { order: { customerId: params.customerId } } : {}),
      ...(params.merchantId ? { order: { merchantId: params.merchantId } } : {}),
      ...(params.search
        ? {
            OR: [
              { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
              { order: { orderNumber: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = params.sortBy
      ? { [params.sortBy]: params.sortOrder }
      : { createdAt: params.sortOrder };

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({ where, skip: params.skip, take: params.take, orderBy, include: invoiceInclude }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  }

  update(id: string, data: Prisma.InvoiceUpdateInput) {
    return prisma.invoice.update({ where: { id }, data, include: invoiceInclude });
  }
}

export const invoicesRepository = new InvoiceRepository();
