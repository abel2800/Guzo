import { prisma, type Prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { emitToOrder, emitToAdmins, emitToUser } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';

/** Package + order context returned to the warehouse UI after a scan. */
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

/**
 * Warehouse floor operations: receive, sort (assign shelf), and dispatch parcels.
 * Each op keeps Package, WarehouseInventory, Order status and the tracking
 * timeline consistent inside a single transaction, then emits realtime updates.
 */
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
      include: { order: { include: { customer: true } } },
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

  async receive(warehouseId: string, input: ReceiveInput) {
    await this.ensureWarehouse(warehouseId);
    const pkg = await this.findPackageByScan(input.trackingNumber);

    const inventory = await prisma.$transaction(async (tx) => {
      await tx.package.update({
        where: { id: pkg.id },
        data: { status: 'IN_WAREHOUSE', warehouseId },
      });

      // Only advance an in-flight order; don't move terminal orders backwards.
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

      // Read the inventory row last so the included package/order reflect the updates above.
      return tx.warehouseInventory.upsert({
        where: { packageId: pkg.id },
        create: { warehouseId, packageId: pkg.id, shelfCode: input.shelfCode, zone: input.zone },
        update: { warehouseId, shelfCode: input.shelfCode, zone: input.zone, receivedAt: new Date(), dispatchedAt: null },
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
    return inventory;
  }

  async sort(warehouseId: string, input: SortInput) {
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
    return updated;
  }

  async dispatch(warehouseId: string, input: DispatchInput) {
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
    await this.ensureWarehouse(warehouseId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [inStock, receivedToday, dispatchedToday, byStatus] = await Promise.all([
      prisma.warehouseInventory.count({ where: { warehouseId, dispatchedAt: null } }),
      prisma.warehouseInventory.count({ where: { warehouseId, receivedAt: { gte: startOfDay } } }),
      prisma.warehouseInventory.count({ where: { warehouseId, dispatchedAt: { gte: startOfDay } } }),
      prisma.package.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { warehouseId },
      }),
    ]);

    return {
      totals: { inStock, receivedToday, dispatchedToday },
      packagesByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }
}

export const warehouseOpsService = new WarehouseOpsService();
