import { prisma } from '@delivery/database';

export class SearchService {
  async search(q: string, limit = 5) {
    if (!q || q.length < 2) return { orders: [], users: [], packages: [] };
    const contains = { contains: q, mode: 'insensitive' as const };

    const [orders, users, packages] = await Promise.all([
      prisma.order.findMany({
        where: { OR: [{ orderNumber: contains }] },
        take: limit,
        select: { id: true, orderNumber: true, status: true, totalAmount: true },
      }),
      prisma.user.findMany({
        where: { deletedAt: null, OR: [{ email: contains }, { firstName: contains }, { lastName: contains }] },
        take: limit,
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.package.findMany({
        where: { OR: [{ trackingNumber: contains }, { barcode: contains }] },
        take: limit,
        select: { id: true, trackingNumber: true, status: true },
      }),
    ]);

    return { orders, users, packages };
  }
}

export const searchService = new SearchService();
