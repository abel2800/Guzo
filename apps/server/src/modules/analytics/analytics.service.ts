import { prisma } from '@delivery/database';

export class AnalyticsService {
  async ordersOverTime(days = 30) {
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

    async operationsMetrics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [delivered, failedDeliveries, lostPackages, lateRows, avgDeliveryHours] = await Promise.all([
      prisma.delivery.count({ where: { deliveredAt: { gte: since } } }),
      prisma.delivery.count({ where: { failedAt: { gte: since } } }),
      prisma.package.count({ where: { status: 'LOST', updatedAt: { gte: since } } }),
      prisma.$queryRawUnsafe<Array<{ cnt: bigint }>>(
        `SELECT COUNT(*)::bigint AS cnt FROM "orders"
         WHERE "status" = 'DELIVERED' AND "deliveredAt" >= $1
         AND "estimatedDeliveryAt" IS NOT NULL AND "deliveredAt" > "estimatedDeliveryAt"`,
        since,
      ),
      prisma.$queryRawUnsafe<Array<{ avg_hours: number | null }>>(
        `SELECT AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "createdAt")) / 3600) AS avg_hours
         FROM "deliveries" WHERE "deliveredAt" >= $1`,
        since,
      ),
    ]);

    const lateDeliveries = Number(lateRows[0]?.cnt ?? 0);

    const totalAttempts = delivered + failedDeliveries;
    const latePct = delivered > 0 ? (lateDeliveries / delivered) * 100 : 0;
    const failPct = totalAttempts > 0 ? (failedDeliveries / totalAttempts) * 100 : 0;

    const branchRankings = await prisma.$queryRawUnsafe<
      Array<{ branch_id: string; branch_name: string; city: string; pickups: bigint; avg_queue: number | null }>
    >(
      `SELECT b.id AS branch_id, b.name AS branch_name, b.city,
              COUNT(i.id)::bigint AS pickups,
              AVG(b."queueLevel") AS avg_queue
       FROM "guzo_branches" b
       LEFT JOIN "guzo_branch_inventory" i ON i."branchId" = b.id AND i."pickedUpAt" >= $1
       WHERE b."isActive" = true
       GROUP BY b.id, b.name, b.city
       ORDER BY pickups DESC
       LIMIT 10`,
      since,
    );

    return {
      rangeDays: days,
      delivered,
      failedDeliveries,
      lostPackages,
      lateDeliveries,
      latePct: Math.round(latePct * 10) / 10,
      failPct: Math.round(failPct * 10) / 10,
      avgDeliveryHours: Math.round(Number(avgDeliveryHours[0]?.avg_hours ?? 0) * 10) / 10,
      branchRankings: branchRankings.map((r) => ({
        branchId: r.branch_id,
        name: r.branch_name,
        city: r.city,
        pickups: Number(r.pickups),
        queueLevel: r.avg_queue ?? 0,
      })),
    };
  }

    async satisfactionSummary(days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [agg, distribution] = await Promise.all([
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: { createdAt: { gte: since } },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { _all: true },
        where: { createdAt: { gte: since } },
        orderBy: { rating: 'asc' },
      }),
    ]);

    return {
      rangeDays: days,
      averageRating: Math.round(Number(agg._avg.rating ?? 0) * 100) / 100,
      totalReviews: agg._count._all,
      distribution: distribution.map((r) => ({ rating: r.rating, count: r._count._all })),
    };
  }
}

export const analyticsService = new AnalyticsService();
