import { prisma } from '@delivery/database';

/** Time-series & breakdown analytics for charts. Read-only. */
export class AnalyticsService {
  async ordersOverTime(days = 30) {
    // Raw SQL groups by day; portable to a warehouse later.
    const rows = await prisma.$queryRawUnsafe<Array<{ day: Date; count: bigint }>>(
      `SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
       FROM "orders"
       WHERE "createdAt" >= NOW() - ($1 || ' days')::interval
       GROUP BY day ORDER BY day ASC`,
      String(days),
    );
    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  async revenueByDeliveryType() {
    const rows = await prisma.order.groupBy({
      by: ['deliveryType'],
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
    return rows.map((r) => ({
      deliveryType: r.deliveryType,
      revenue: Number(r._sum.totalAmount ?? 0),
      orders: r._count._all,
    }));
  }

  async topDrivers(limit = 5) {
    const drivers = await prisma.driver.findMany({
      orderBy: { totalDeliveries: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    return drivers.map((d) => ({
      driverCode: d.driverCode,
      name: `${d.user.firstName} ${d.user.lastName}`,
      totalDeliveries: d.totalDeliveries,
      rating: Number(d.rating),
    }));
  }
}

export const analyticsService = new AnalyticsService();
