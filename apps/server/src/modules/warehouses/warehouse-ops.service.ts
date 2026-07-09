import { prisma, type Prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { emitToOrder, emitToAdmins, emitToUser } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';
import { writeActivity } from '../../utils/activity.js';

const inventoryInclude = {
  package: {
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          dropoffAddress: { select: { city: true, line1: true, contactName: true } },
          customer: { select: { userId: true } },
        },
      },
    },
  },
  warehouse: { select: { id: true, code: true, name: true } },
} satisfies Prisma.WarehouseInventoryInclude;

interface ReceiveInput {
  trackingNumber: string;
  shelfCode?: string;
  zone?: string;
  note?: string;
}

interface SortInput {
  trackingNumber: string;
  shelfCode: string;
  zone?: string;
}

interface DispatchInput {
  trackingNumber: string;
  note?: string;
}

export class WarehouseOpsService {
  private async ensureWarehouse(warehouseId: string) {
    const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!wh) throw ApiError.notFound('Warehouse not found');
    return wh;
  }

  private async findPackageByScan(trackingNumber: string) {
    const code = trackingNumber.trim();
    const pkg = await prisma.package.findFirst({
      where: { OR: [{ trackingNumber: code }, { barcode: code }] },
      include: { order: { include: { customer: true, dropoffAddress: { select: { city: true } } } } },
    });
    if (!pkg) throw ApiError.notFound(`No parcel found for "${code}"`);
    return pkg;
  }

  private notifyOrder(
    orderId: string,
    customerUserId: string | undefined,
    orderNumber: string,
    status: string,
    body: string,
  ) {
    eventBus.publish(DOMAIN_EVENTS.ORDER_STATUS_CHANGED, { orderId, status });
    emitToOrder(orderId, SOCKET_EVENTS.ORDER_STATUS, { orderId, status });
    emitToAdmins(SOCKET_EVENTS.ORDER_STATUS, { orderId, status });
    if (customerUserId) {
      emitToUser(customerUserId, SOCKET_EVENTS.NOTIFICATION_NEW, {
        type: 'ORDER_STATUS',
        title: `Parcel ${orderNumber}`,
        body,
      });
    }
  }

  private shelfZoneForCity(city: string | null | undefined) {
    if (!city) return 'Z';
    const c = city.trim().toLowerCase();
    if (c.includes('addis')) return 'A';
    if (c.includes('hawassa')) return 'H';
    if (c.includes('adama') || c.includes('nazret')) return 'AD';
    if (c.includes('bahir')) return 'BD';
    if (c.includes('dire')) return 'DD';
    if (c.includes('mekelle')) return 'M';
    if (c.includes('gondar')) return 'G';
    return c.length >= 2 ? c.slice(0, 2).toUpperCase() : 'Z';
  }

  async receive(warehouseId: string, input: ReceiveInput, userId?: string) {
    await this.ensureWarehouse(warehouseId);
    const pkg = await this.findPackageByScan(input.trackingNumber);

    let shelfCode = input.shelfCode;
    let zone = input.zone;
    if (!shelfCode?.trim()) {
      const city = pkg.order.dropoffAddress?.city ?? 'General';
      zone = this.shelfZoneForCity(city);
      const inStock = await prisma.warehouseInventory.count({ where: { warehouseId, dispatchedAt: null } });
      shelfCode = `${zone}-${String((inStock % 20) + 1).padStart(2, '0')}`;
    }

    const inventory = await prisma.$transaction(async (tx) => {
      await tx.package.update({
        where: { id: pkg.id },
        data: { status: 'IN_WAREHOUSE', warehouseId },
      });

            if (!['DELIVERED', 'CANCELLED', 'RETURNED'].includes(pkg.order.status)) {
        await tx.order.update({ where: { id: pkg.orderId }, data: { status: 'AT_WAREHOUSE' } });
      }

      await tx.trackingEvent.create({
        data: {
          orderId: pkg.orderId,
          type: 'ARRIVED_AT_WAREHOUSE',
          status: 'Arrived at warehouse',
          description: input.note ?? `Received at warehouse${input.shelfCode ? ` · shelf ${input.shelfCode}` : ''}`,
        },
      });

            return tx.warehouseInventory.upsert({
        where: { packageId: pkg.id },
        create: { warehouseId, packageId: pkg.id, shelfCode, zone },
        update: { warehouseId, shelfCode, zone, receivedAt: new Date(), dispatchedAt: null },
        include: inventoryInclude,
      });
    });

    this.notifyOrder(
      pkg.orderId,
      pkg.order.customer?.userId,
      pkg.order.orderNumber,
      'AT_WAREHOUSE',
      `Your parcel ${pkg.order.orderNumber} arrived at the warehouse`,
    );

    if (userId) {
      await writeActivity({
        userId,
        action: 'warehouse.receive',
        metadata: { warehouseId, trackingNumber: input.trackingNumber, shelfCode },
      });
    }
    return inventory;
  }

  async sort(warehouseId: string, input: SortInput, userId?: string) {
    await this.ensureWarehouse(warehouseId);
    const pkg = await this.findPackageByScan(input.trackingNumber);

    const inv = await prisma.warehouseInventory.findUnique({ where: { packageId: pkg.id } });
    if (!inv || inv.dispatchedAt) throw ApiError.badRequest('Parcel is not currently in stock at a warehouse');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.package.update({ where: { id: pkg.id }, data: { status: 'SORTED' } });
      await tx.trackingEvent.create({
        data: {
          orderId: pkg.orderId,
          type: 'SORTED',
          status: 'Sorted',
          description: `Assigned to shelf ${input.shelfCode}${input.zone ? ` (zone ${input.zone})` : ''}`,
        },
      });
      return tx.warehouseInventory.update({
        where: { packageId: pkg.id },
        data: { warehouseId, shelfCode: input.shelfCode, zone: input.zone },
        include: inventoryInclude,
      });
    });

    if (userId) {
      await writeActivity({
        userId,
        action: 'warehouse.sort',
        metadata: { warehouseId, trackingNumber: input.trackingNumber, shelfCode: input.shelfCode },
      });
    }
    return updated;
  }

  async dispatch(warehouseId: string, input: DispatchInput, userId?: string) {
    await this.ensureWarehouse(warehouseId);
    const pkg = await this.findPackageByScan(input.trackingNumber);

    const inv = await prisma.warehouseInventory.findUnique({ where: { packageId: pkg.id } });
    if (!inv || inv.dispatchedAt) throw ApiError.badRequest('Parcel is not currently in stock at a warehouse');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.package.update({ where: { id: pkg.id }, data: { status: 'DISPATCHED' } });
      if (!['DELIVERED', 'CANCELLED', 'RETURNED'].includes(pkg.order.status)) {
        await tx.order.update({ where: { id: pkg.orderId }, data: { status: 'OUT_FOR_DELIVERY' } });
      }
      await tx.trackingEvent.create({
        data: {
          orderId: pkg.orderId,
          type: 'DISPATCHED',
          status: 'Dispatched',
          description: input.note ?? 'Dispatched from warehouse for delivery',
        },
      });
      return tx.warehouseInventory.update({
        where: { packageId: pkg.id },
        data: { dispatchedAt: new Date() },
        include: inventoryInclude,
      });
    });

    this.notifyOrder(
      pkg.orderId,
      pkg.order.customer?.userId,
      pkg.order.orderNumber,
      'OUT_FOR_DELIVERY',
      `Your parcel ${pkg.order.orderNumber} is out for delivery`,
    );

    if (userId) {
      await writeActivity({
        userId,
        action: 'warehouse.dispatch',
        metadata: { warehouseId, trackingNumber: input.trackingNumber },
      });
    }
    return updated;
  }

  async listInventory(
    warehouseId: string,
    query: ParsedListQuery,
    state: 'in-stock' | 'dispatched' | 'all' = 'in-stock',
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    await this.ensureWarehouse(warehouseId);

    const where: Prisma.WarehouseInventoryWhereInput = {
      warehouseId,
      ...(state === 'in-stock' ? { dispatchedAt: null } : {}),
      ...(state === 'dispatched' ? { dispatchedAt: { not: null } } : {}),
      ...(query.search
        ? { package: { OR: [
            { trackingNumber: { contains: query.search, mode: 'insensitive' } },
            { barcode: { contains: query.search, mode: 'insensitive' } },
          ] } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.warehouseInventory.findMany({
        where,
        include: inventoryInclude,
        skip: query.skip,
        take: query.take,
        orderBy: { receivedAt: query.sortOrder },
      }),
      prisma.warehouseInventory.count({ where }),
    ]);
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async stats(warehouseId: string) {
    const wh = await this.ensureWarehouse(warehouseId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [inStock, receivedToday, dispatchedToday, byStatus, shelfGroups] = await Promise.all([
      prisma.warehouseInventory.count({ where: { warehouseId, dispatchedAt: null } }),
      prisma.warehouseInventory.count({ where: { warehouseId, receivedAt: { gte: startOfDay } } }),
      prisma.warehouseInventory.count({ where: { warehouseId, dispatchedAt: { gte: startOfDay } } }),
      prisma.package.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { warehouseId },
      }),
      prisma.warehouseInventory.groupBy({
        by: ['shelfCode'],
        where: { warehouseId, dispatchedAt: null, shelfCode: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const distinctShelves = shelfGroups.length;
    const capacity = wh.capacity || 0;
    const capacityPercent = capacity > 0 ? Math.min(100, (inStock * 100) / capacity) : 0;
    const shelfUtilization =
      distinctShelves > 0 ? Math.min(100, (inStock * 100) / (distinctShelves * 10)) : 0;

    return {
      totals: {
        inStock,
        receivedToday,
        dispatchedToday,
        capacity,
        capacityPercent: Math.round(capacityPercent * 10) / 10,
        distinctShelves,
        shelfUtilization: Math.round(shelfUtilization * 10) / 10,
      },
      packagesByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }

  async inventoryByCity(warehouseId: string) {
    await this.ensureWarehouse(warehouseId);
    const items = await prisma.warehouseInventory.findMany({
      where: { warehouseId, dispatchedAt: null },
      include: inventoryInclude,
      orderBy: { receivedAt: 'asc' },
    });
    const grouped = new Map<string, unknown[]>();
    for (const item of items) {
      const city = item.package.order.dropoffAddress?.city ?? 'Unknown';
      const list = grouped.get(city) ?? [];
      list.push(item);
      grouped.set(city, list);
    }
    return Array.from(grouped.entries()).map(([city, parcels]) => ({
      city,
      count: parcels.length,
      parcels,
    }));
  }

  async agingReport(warehouseId: string) {
    await this.ensureWarehouse(warehouseId);
    const items = await prisma.warehouseInventory.findMany({
      where: { warehouseId, dispatchedAt: null },
      include: { package: { select: { trackingNumber: true } } },
      orderBy: { receivedAt: 'asc' },
    });
    const now = Date.now();
    let under24h = 0;
    let oneToThreeDays = 0;
    let threeToSevenDays = 0;
    let overSevenDays = 0;
    const stale: Array<{ trackingNumber: string; receivedAt: Date; hoursInStock: number; shelfCode: string | null }> =
      [];
    for (const inv of items) {
      const hours = (now - inv.receivedAt.getTime()) / 3_600_000;
      if (hours < 24) under24h++;
      else if (hours < 72) oneToThreeDays++;
      else if (hours < 168) threeToSevenDays++;
      else {
        overSevenDays++;
        stale.push({
          trackingNumber: inv.package.trackingNumber,
          receivedAt: inv.receivedAt,
          hoursInStock: Math.floor(hours),
          shelfCode: inv.shelfCode,
        });
      }
    }
    return {
      buckets: { under24h, oneToThreeDays, threeToSevenDays, overSevenDays },
      stale,
    };
  }

  async transfer(fromWarehouseId: string, input: { trackingNumber: string; destinationWarehouseId: string }) {
    await this.ensureWarehouse(fromWarehouseId);
    await this.ensureWarehouse(input.destinationWarehouseId);
    const pkg = await this.findPackageByScan(input.trackingNumber);
    const inv = await prisma.warehouseInventory.findUnique({ where: { packageId: pkg.id } });
    if (!inv || inv.dispatchedAt) throw ApiError.badRequest('Parcel is not currently in stock at a warehouse');
    if (inv.warehouseId !== fromWarehouseId) throw ApiError.badRequest('Parcel is not at the source warehouse');
    await prisma.warehouseInventory.update({
      where: { packageId: pkg.id },
      data: { dispatchedAt: new Date() },
    });
    return this.receive(input.destinationWarehouseId, {
      trackingNumber: input.trackingNumber,
      note: `Cross-warehouse transfer from ${fromWarehouseId}`,
    });
  }
}

export const warehouseOpsService = new WarehouseOpsService();
