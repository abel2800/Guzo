import { prisma } from '@delivery/database';
import { branchOpsService } from '../branches/branch-ops.service.js';
import { customerOrderAccessFilter, linkOrdersToCustomerAccount } from '../customers/customer-link.service.js';

export class DashboardService {
  async adminSummary() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      users,
      orders,
      drivers,
      activeDeliveries,
      revenue,
      pendingOrders,
      warehouses,
      branches,
      merchants,
      pendingUsers,
      pendingDrivers,
      ordersLast7d,
      ordersPrev7d,
      revenueLast7d,
      revenuePrev7d,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.order.count(),
      prisma.driver.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.delivery.count({ where: { deliveredAt: null, driverId: { not: null } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.guzoBranch.count({ where: { isActive: true } }),
      prisma.merchant.count(),
      prisma.user.count({ where: { deletedAt: null, status: 'PENDING' } }),
      prisma.driver.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: sevenDaysAgo } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      }),
    ]);

    const ordersByStatus = await prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
    const revLast = Number(revenueLast7d._sum.amount ?? 0);
    const revPrev = Number(revenuePrev7d._sum.amount ?? 0);
    const orderGrowthPct = ordersPrev7d > 0 ? ((ordersLast7d - ordersPrev7d) / ordersPrev7d) * 100 : ordersLast7d > 0 ? 100 : 0;
    const revenueGrowthPct = revPrev > 0 ? ((revLast - revPrev) / revPrev) * 100 : revLast > 0 ? 100 : 0;

    return {
      totals: {
        users,
        orders,
        approvedDrivers: drivers,
        activeDeliveries,
        pendingOrders,
        revenue: Number(revenue._sum.amount ?? 0),
        warehouses,
        branches,
        merchants,
        pendingUsers,
        pendingDrivers,
      },
      growth: {
        ordersLast7d,
        ordersPrev7d,
        orderGrowthPct: Math.round(orderGrowthPct * 10) / 10,
        revenueLast7d: revLast,
        revenuePrev7d: revPrev,
        revenueGrowthPct: Math.round(revenueGrowthPct * 10) / 10,
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

    const [warehouses, inStock, receivedToday, dispatchedToday, byStatus, capacityAgg, inTransitManifests] =
      await Promise.all([
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.warehouseInventory.count({ where: { dispatchedAt: null } }),
      prisma.warehouseInventory.count({ where: { receivedAt: { gte: startOfDay } } }),
      prisma.warehouseInventory.count({ where: { dispatchedAt: { gte: startOfDay } } }),
      prisma.package.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.warehouse.aggregate({ _sum: { capacity: true }, where: { isActive: true } }),
      prisma.transportManifest.count({ where: { status: 'IN_TRANSIT' } }),
    ]);

    const totalCapacity = capacityAgg._sum.capacity ?? 0;
    const capacityPercent = totalCapacity > 0 ? Math.min(100, (inStock * 100) / totalCapacity) : 0;

    return {
      totals: {
        warehouses,
        inStock,
        receivedToday,
        dispatchedToday,
        totalCapacity,
        capacityPercent: Math.round(capacityPercent * 10) / 10,
        trucksInTransit: inTransitManifests,
      },
      packagesByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async operationsTrucks() {
    const rows = await prisma.transportManifest.findMany({
      where: { status: 'IN_TRANSIT' },
      orderBy: { departedAt: 'desc' },
      include: {
        driver: { select: { id: true, driverCode: true, currentLat: true, currentLng: true, lastLocationAt: true } },
        originWarehouse: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
        destinationWarehouse: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
        _count: { select: { parcels: true } },
      },
    });
    return rows.map((m) => ({
      id: m.id,
      manifestNumber: m.manifestNumber,
      sealNumber: m.sealNumber,
      departedAt: m.departedAt,
      parcelCount: m._count.parcels,
      origin: m.originWarehouse,
      destination: m.destinationWarehouse,
      driver: m.driver,
    }));
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
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    if (!customer) {
      return {
        totals: { orders: 0, inTransit: 0, delivered: 0, openTickets: 0 },
        ordersByStatus: [],
        parcels: { active: 0, incoming: 0, readyForPickup: 0, delivered: 0, draft: 0 },
        recentOrders: [],
      };
    }

    if (user?.phone) {
      await linkOrdersToCustomerAccount(userId, user.phone);
    }

    const accessAll = customerOrderAccessFilter({
      customerId: customer.id,
      userId,
      phone: user?.phone,
      scope: 'all',
    });
    const accessIncoming = customerOrderAccessFilter({
      customerId: customer.id,
      userId,
      phone: user?.phone,
      scope: 'incoming',
    });

    const inTransitStatuses = [
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'AT_WAREHOUSE',
      'AT_BRANCH',
      'AT_DESTINATION_BRANCH',
      'READY_FOR_PICKUP',
    ] as const;
    const activeStatuses = ['CONFIRMED', ...inTransitStatuses] as const;
    const readyStatuses = ['READY_FOR_PICKUP', 'AT_DESTINATION_BRANCH'] as const;

    const [
      orders,
      delivered,
      active,
      openTickets,
      ordersByStatus,
      incomingCount,
      activeCount,
      readyCount,
      deliveredCount,
      draftCount,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({ where: accessAll }),
      prisma.order.count({ where: { ...accessAll, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...accessAll, status: { in: [...inTransitStatuses] } } }),
      prisma.supportTicket.count({
        where: { requesterId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] } },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, where: accessAll }),
      prisma.order.count({ where: accessIncoming }),
      prisma.order.count({ where: { ...accessAll, status: { in: [...activeStatuses] } } }),
      prisma.order.count({ where: { ...accessAll, status: { in: [...readyStatuses] } } }),
      prisma.order.count({ where: { ...accessAll, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...accessAll, status: 'PENDING_PAYMENT' } }),
      prisma.order.findMany({
        where: accessAll,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, status: true, createdAt: true },
      }),
    ]);

    return {
      totals: { orders, inTransit: active, delivered, openTickets },
      ordersByStatus: ordersByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      parcels: {
        active: activeCount,
        incoming: incomingCount,
        readyForPickup: readyCount,
        delivered: deliveredCount,
        draft: draftCount,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const driverFilter = { delivery: { driverId: driver.id } };

    const [activeDeliveries, completedDeliveries, todayPickups, todayDeliveries, intercityTrips, availableJobs] =
      await Promise.all([
        prisma.delivery.count({ where: { driverId: driver.id, deliveredAt: null } }),
        prisma.delivery.count({ where: { driverId: driver.id, deliveredAt: { not: null } } }),
        prisma.order.count({
          where: {
            ...driverFilter,
            status: { in: ['ASSIGNED', 'PICKED_UP'] },
            updatedAt: { gte: startOfDay },
          },
        }),
        prisma.order.count({
          where: {
            ...driverFilter,
            status: 'DELIVERED',
            deliveredAt: { gte: startOfDay },
          },
        }),
        prisma.transportManifest.count({
          where: { driverId: driver.id, status: { in: ['DRAFT', 'SEALED', 'IN_TRANSIT'] } },
        }),
        prisma.order.count({
          where: { status: { in: ['CONFIRMED', 'AT_BRANCH'] }, delivery: null },
        }),
      ]);

    return {
      driverCode: driver.driverCode,
      status: driver.status,
      isAvailable: driver.isAvailable,
      earningsBalance: Number(driver.earningsBalance),
      rating: Number(driver.rating),
      activeDeliveries,
      completedDeliveries,
      today: {
        pickups: todayPickups,
        deliveries: todayDeliveries,
        intercity: intercityTrips,
        available: availableJobs,
      },
    };
  }

  async branchSummary(branchId: string, user: { id: string; roles: string[] }) {
    return branchOpsService.stats(branchId, user);
  }
}

export const dashboardService = new DashboardService();
