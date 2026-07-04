import { prisma } from '@delivery/database';

/**
 * Report builders. Return plain JSON now; the same shapes can be streamed to
 * CSV/PDF later. Date range filtering keeps queries bounded.
 */
export class ReportsService {
  private range(from?: string, to?: string) {
    const gte = from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000);
    const lte = to ? new Date(to) : new Date();
    return { gte, lte };
  }

  async ordersReport(from?: string, to?: string) {
    const createdAt = this.range(from, to);
    const [count, revenue, byStatus] = await Promise.all([
      prisma.order.count({ where: { createdAt } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt } }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, where: { createdAt } }),
    ]);
    return {
      range: createdAt,
      totalOrders: count,
      totalRevenue: Number(revenue._sum.totalAmount ?? 0),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async deliveriesReport(from?: string, to?: string) {
    const createdAt = this.range(from, to);
    const [delivered, failed] = await Promise.all([
      prisma.delivery.count({ where: { createdAt, deliveredAt: { not: null } } }),
      prisma.delivery.count({ where: { createdAt, failedAt: { not: null } } }),
    ]);
    return { range: createdAt, delivered, failed, total: delivered + failed };
  }
}

export const reportsService = new ReportsService();
