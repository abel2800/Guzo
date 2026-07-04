import { prisma } from '@delivery/database';

/**
 * Aggregate read-model for admin/merchant dashboards. Pure reads, no writes.
 * Heavy queries here are the first candidates for a Redis cache later.
 */
export class DashboardService {
  async adminSummary() {
    const [users, orders, drivers, activeDeliveries, revenue, pendingOrders] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.order.count(),
      prisma.driver.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.delivery.count({ where: { deliveredAt: null, driverId: { not: null } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    ]);

    const ordersByStatus = await prisma.order.groupBy({ by: ['status'], _count: { _all: true } });

    return {
      totals: {
        users,
        orders,
        approvedDrivers: drivers,
        activeDeliveries,
        pendingOrders,
        revenue: Number(revenue._sum.amount ?? 0),
      },
      ordersByStatus: ordersByStatus.map((row) => ({ status: row.status, count: row._count._all })),
    };
  }

  async merchantSummary(userId: string) {
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) return null;
    const where = { merchantId: merchant.id };
    const inTransitStatuses = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] as const;

    const [orders, delivered, inTransit, pendingPayment, revenue] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...where, status: { in: [...inTransitStatuses] } } }),
      prisma.order.count({ where: { ...where, status: 'PENDING_PAYMENT' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { ...where, status: { notIn: ['PENDING_PAYMENT', 'CANCELLED'] } },
      }),
    ]);

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
      where,
    });

    return {
      merchantCode: merchant.merchantCode,
      businessName: merchant.businessName,
      totals: {
        orders,
        delivered,
        inTransit,
        pendingPayment,
        revenue: Number(revenue._sum.totalAmount ?? 0),
      },
      ordersByStatus: ordersByStatus.map((row) => ({ status: row.status, count: row._count._all })),
    };
  }

  async warehouseSummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [warehouses, inStock, receivedToday, dispatchedToday, byStatus] = await Promise.all([
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.warehouseInventory.count({ where: { dispatchedAt: null } }),
      prisma.warehouseInventory.count({ where: { receivedAt: { gte: startOfDay } } }),
      prisma.warehouseInventory.count({ where: { dispatchedAt: { gte: startOfDay } } }),
      prisma.package.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return {
      totals: { warehouses, inStock, receivedToday, dispatchedToday },
      packagesByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async financeSummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [grossAgg, refundAgg, paidCount, pendingCount, refundedCount, outstandingAgg, byStatus] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['PAID', 'PARTIALLY_REFUNDED'] } },
      }),
      prisma.payment.aggregate({ _sum: { refundedAmount: true } }),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.payment.count({ where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: { status: { in: ['ISSUED', 'OVERDUE'] } },
      }),
      prisma.payment.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const gross = Number(grossAgg._sum.amount ?? 0);
    const refunded = Number(refundAgg._sum.refundedAmount ?? 0);

    return {
      totals: {
        grossRevenue: gross,
        refunded,
        netRevenue: Math.round((gross - refunded) * 100) / 100,
        paidCount,
        pendingCount,
        refundedCount,
        outstandingInvoices: outstandingAgg._count._all,
        outstandingAmount: Number(outstandingAgg._sum.total ?? 0),
      },
      paymentsByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async customerSummary(userId: string) {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return { totals: { orders: 0, inTransit: 0, delivered: 0, openTickets: 0 }, ordersByStatus: [] };

    const where = { customerId: customer.id };
    const inTransit = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'AT_WAREHOUSE'] as const;

    const [orders, delivered, active, openTickets, ordersByStatus] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...where, status: { in: [...inTransit] } } }),
      prisma.supportTicket.count({ where: { requesterId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] } } }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, where }),
    ]);

    return {
      totals: { orders, inTransit: active, delivered, openTickets },
      ordersByStatus: ordersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async supportSummary() {
    const [open, inProgress, waiting, resolvedToday, byStatus] = await Promise.all([
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'WAITING_CUSTOMER' } }),
      prisma.supportTicket.count({
        where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return {
      totals: { open, inProgress, waiting, resolvedToday, total: open + inProgress + waiting },
      ticketsByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async driverSummary(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) return null;
    const [assigned, completed] = await Promise.all([
      prisma.delivery.count({ where: { driverId: driver.id, deliveredAt: null } }),
      prisma.delivery.count({ where: { driverId: driver.id, deliveredAt: { not: null } } }),
    ]);
    return {
      driverCode: driver.driverCode,
      status: driver.status,
      isAvailable: driver.isAvailable,
      earningsBalance: Number(driver.earningsBalance),
      rating: Number(driver.rating),
      activeDeliveries: assigned,
      completedDeliveries: completed,
    };
  }
}

export const dashboardService = new DashboardService();
