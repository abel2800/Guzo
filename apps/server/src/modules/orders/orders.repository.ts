import { prisma, type Prisma, type OrderStatus } from '@delivery/database';
import { generateReference } from '@delivery/utils';

const orderInclude = {
  customer: { include: { user: true } },
  merchant: true,
  pickupAddress: true,
  dropoffAddress: true,
  packages: true,
  delivery: {
    include: {
      driver: { include: { user: true } },
      proofFile: true,
      signatureFile: true,
    },
  },
  payment: true,
  invoice: true,
  trackingEvents: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

export class OrdersRepository {
  async list(params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    customerId?: string;
    merchantId?: string;
    driverId?: string;
    unassigned?: boolean;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status as Prisma.EnumOrderStatusFilter['equals'] } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.merchantId ? { merchantId: params.merchantId } : {}),
            ...(params.driverId ? { delivery: { driverId: params.driverId } } : {}),
            ...(params.unassigned ? { delivery: { is: null }, status: 'CONFIRMED' } : {}),
      ...(params.search
        ? {
            OR: [
              { orderNumber: { contains: params.search, mode: 'insensitive' } },
              { packages: { some: { trackingNumber: { contains: params.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.OrderOrderByWithRelationInput = params.sortBy
      ? { [params.sortBy]: params.sortOrder }
      : { createdAt: params.sortOrder };

    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, skip: params.skip, take: params.take, orderBy, include: orderInclude }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: orderInclude });
  }

  findByNumber(orderNumber: string) {
    return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  }

  customerByUserId(userId: string) {
    return prisma.customer.findUnique({ where: { userId } });
  }

  driverByUserId(userId: string) {
    return prisma.driver.findUnique({ where: { userId } });
  }

  merchantByUserId(userId: string) {
    return prisma.merchant.findUnique({ where: { userId } });
  }

    async ensureCustomerForUser(userId: string) {
    const existing = await prisma.customer.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.customer.create({
      data: { userId, customerCode: generateReference('CUST') },
    });
  }

  activePricingRule(deliveryType: string) {
    return prisma.pricingRule.findFirst({
      where: { deliveryType: deliveryType as Prisma.EnumDeliveryTypeFilter['equals'], isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  couponByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  }

    create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({ data, include: orderInclude });
  }

  updateStatus(id: string, status: string, extra: Prisma.OrderUpdateInput = {}) {
    return prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus, ...extra },
      include: orderInclude,
    });
  }

  addTrackingEvent(data: Prisma.TrackingEventUncheckedCreateInput) {
    return prisma.trackingEvent.create({ data });
  }

  assignDriver(orderId: string, driverId: string, vehicleId?: string) {
    return prisma.delivery.upsert({
      where: { orderId },
      create: { orderId, driverId, vehicleId, assignedAt: new Date() },
      update: { driverId, vehicleId, assignedAt: new Date() },
    });
  }

  createFile(data: Prisma.FileUncheckedCreateInput) {
    return prisma.file.create({ data });
  }

  updateDelivery(orderId: string, data: Prisma.DeliveryUpdateInput) {
    return prisma.delivery.update({ where: { orderId }, data });
  }

  get client() {
    return prisma;
  }
}

export const ordersRepository = new OrdersRepository();
export { orderInclude };
