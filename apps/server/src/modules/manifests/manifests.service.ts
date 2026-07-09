import { prisma } from '@delivery/database';
import { ApiError } from '../../utils/ApiError.js';
import { warehouseOpsService } from '../warehouses/warehouse-ops.service.js';
import { emitToAdmins, emitToOrder, emitToUser } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';

const TERMINAL_ORDER = ['DELIVERED', 'CANCELLED', 'RETURNED'] as const;

function manifestNumber() {
  return `MNF-${Date.now()}`;
}

function toSummary(m: {
  id: string;
  manifestNumber: string;
  status: string;
  sealNumber: string | null;
  originWarehouseId: string | null;
  destinationWarehouseId: string | null;
  driverId: string | null;
  departedAt: Date | null;
  arrivedAt: Date | null;
  createdAt: Date;
  driver?: { currentLat: number | null; currentLng: number | null; driverCode: string } | null;
  _count?: { parcels: number };
}) {
  return {
    id: m.id,
    manifestNumber: m.manifestNumber,
    status: m.status,
    sealNumber: m.sealNumber,
    originWarehouseId: m.originWarehouseId,
    destinationWarehouseId: m.destinationWarehouseId,
    driverId: m.driverId,
    departedAt: m.departedAt,
    arrivedAt: m.arrivedAt,
    createdAt: m.createdAt,
    parcelCount: m._count?.parcels ?? 0,
    driverLocation:
      m.driver?.currentLat != null && m.driver?.currentLng != null
        ? { lat: m.driver.currentLat, lng: m.driver.currentLng, driverCode: m.driver.driverCode }
        : null,
  };
}

export class ManifestsService {
  async list(warehouseId: string, scope: 'outbound' | 'inbound' | 'in-transit' = 'outbound') {
    const where =
      scope === 'inbound'
        ? { destinationWarehouseId: warehouseId }
        : scope === 'in-transit'
          ? { status: 'IN_TRANSIT' as const }
          : { originWarehouseId: warehouseId };
    const rows = await prisma.transportManifest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: { select: { currentLat: true, currentLng: true, driverCode: true } },
        _count: { select: { parcels: true } },
      },
    });
    return rows.map(toSummary);
  }

  async liveTrucks() {
    return this.list('', 'in-transit');
  }

  async getDetail(id: string) {
    const manifest = await prisma.transportManifest.findUnique({
      where: { id },
      include: {
        driver: { select: { currentLat: true, currentLng: true, driverCode: true } },
        parcels: {
          include: { package: { select: { id: true, trackingNumber: true, status: true } } },
          orderBy: { scannedAt: 'asc' },
        },
      },
    });
    if (!manifest) throw ApiError.notFound('Manifest not found');
    const unloadStatus = await this.unloadStatus(id);
    return {
      ...toSummary({ ...manifest, _count: { parcels: manifest.parcels.length } }),
      parcels: manifest.parcels.map((p) => ({
        id: p.id,
        packageId: p.packageId,
        trackingNumber: p.package.trackingNumber,
        status: p.package.status,
        scannedAt: p.scannedAt,
        unloadedAt: p.unloadedAt,
      })),
      unloadStatus,
    };
  }

  async createDraft(input: { originWarehouseId: string; destinationWarehouseId?: string; driverId?: string }) {
    await prisma.warehouse.findUniqueOrThrow({ where: { id: input.originWarehouseId } });
    if (input.destinationWarehouseId) {
      await prisma.warehouse.findUniqueOrThrow({ where: { id: input.destinationWarehouseId } });
    }
    return prisma.transportManifest.create({
      data: {
        manifestNumber: manifestNumber(),
        originWarehouseId: input.originWarehouseId,
        destinationWarehouseId: input.destinationWarehouseId,
        driverId: input.driverId,
        status: 'DRAFT',
      },
    });
  }

  async scanParcel(manifestId: string, input: { packageId?: string; trackingNumber?: string; scannedByUserId?: string }) {
    const manifest = await prisma.transportManifest.findUnique({ where: { id: manifestId } });
    if (!manifest) throw ApiError.notFound('Manifest not found');
    if (!['DRAFT', 'SEALED'].includes(manifest.status)) {
      throw ApiError.badRequest(`Cannot scan parcels onto manifest in status ${manifest.status}`);
    }

    const pkg = await this.resolvePackage(input.packageId, input.trackingNumber);
    if (pkg.warehouseId !== manifest.originWarehouseId) {
      throw ApiError.badRequest('Parcel is not at the origin warehouse for this manifest');
    }
    const inv = await prisma.warehouseInventory.findUnique({ where: { packageId: pkg.id } });
    if (!inv || inv.dispatchedAt) throw ApiError.badRequest('Parcel is not in warehouse inventory');

    const exists = await prisma.manifestParcel.findFirst({ where: { manifestId, packageId: pkg.id } });
    if (exists) throw ApiError.badRequest('Parcel already on manifest');

    const row = await prisma.$transaction(async (tx) => {
      if (manifest.status === 'DRAFT') {
        await tx.transportManifest.update({ where: { id: manifestId }, data: { status: 'SEALED' } });
      }
      return tx.manifestParcel.create({
        data: {
          manifestId,
          packageId: pkg.id,
          scannedByUserId: input.scannedByUserId,
        },
      });
    });
    return row;
  }

  async depart(manifestId: string, sealNumber: string) {
    const manifest = await prisma.transportManifest.findUnique({
      where: { id: manifestId },
      include: { parcels: { include: { package: { include: { order: { include: { customer: true } } } } } } },
    });
    if (!manifest) throw ApiError.notFound('Manifest not found');
    if (!manifest.parcels.length) throw ApiError.badRequest('Manifest has no parcels');

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      for (const mp of manifest.parcels) {
        const pkg = mp.package;
        await tx.package.update({ where: { id: pkg.id }, data: { status: 'IN_TRANSIT' } });
        if (!TERMINAL_ORDER.includes(pkg.order.status as (typeof TERMINAL_ORDER)[number])) {
          await tx.order.update({ where: { id: pkg.orderId }, data: { status: 'IN_TRANSIT' } });
        }
        await tx.warehouseInventory.updateMany({
          where: { packageId: pkg.id },
          data: { dispatchedAt: now },
        });
        await tx.trackingEvent.create({
          data: {
            orderId: pkg.orderId,
            type: 'IN_TRANSIT',
            status: 'In transit',
            description: `Departed on manifest ${manifest.manifestNumber}`,
          },
        });
        const userId = pkg.order.customer?.userId;
        if (userId) {
          emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
            type: 'ORDER_STATUS',
            title: 'In transit',
            body: `Your parcel ${pkg.order.orderNumber} departed on truck ${manifest.manifestNumber}`,
          });
        }
        emitToOrder(pkg.orderId, SOCKET_EVENTS.ORDER_STATUS, { orderId: pkg.orderId, status: 'IN_TRANSIT' });
      }
      await tx.transportManifest.update({
        where: { id: manifestId },
        data: { sealNumber, status: 'IN_TRANSIT', departedAt: now },
      });
    });
    emitToAdmins(SOCKET_EVENTS.ORDER_STATUS, { manifestId, status: 'IN_TRANSIT' });
    return prisma.transportManifest.findUniqueOrThrow({ where: { id: manifestId } });
  }

  async arrive(manifestId: string) {
    const manifest = await prisma.transportManifest.findUnique({ where: { id: manifestId } });
    if (!manifest) throw ApiError.notFound('Manifest not found');
    if (manifest.status !== 'IN_TRANSIT') throw ApiError.badRequest('Manifest is not in transit');
    return prisma.transportManifest.update({
      where: { id: manifestId },
      data: { status: 'ARRIVED', arrivedAt: new Date() },
    });
  }

  async unloadScan(manifestId: string, trackingNumber: string) {
    let manifest = await prisma.transportManifest.findUnique({ where: { id: manifestId } });
    if (!manifest) throw ApiError.notFound('Manifest not found');
    if (!['ARRIVED', 'IN_TRANSIT'].includes(manifest.status)) {
      throw ApiError.badRequest('Manifest is not ready for unload');
    }
    if (manifest.status === 'IN_TRANSIT') {
      manifest = await this.arrive(manifestId);
    }

    const pkg = await this.resolvePackage(undefined, trackingNumber);
    const mp = await prisma.manifestParcel.findFirst({ where: { manifestId, packageId: pkg.id } });
    if (!mp) throw ApiError.badRequest('Parcel not on this manifest');

    if (!mp.unloadedAt) {
      await prisma.manifestParcel.update({ where: { id: mp.id }, data: { unloadedAt: new Date() } });
    }

    if (manifest.destinationWarehouseId) {
      await warehouseOpsService.receive(manifest.destinationWarehouseId, {
        trackingNumber: pkg.trackingNumber,
        note: `Unloaded from manifest ${manifest.manifestNumber}`,
      });
    }

    const status = await this.unloadStatus(manifestId);
    if (status.complete) {
      await prisma.transportManifest.update({ where: { id: manifestId }, data: { status: 'UNLOADED' } });
    }
    return { ...status, scannedTracking: pkg.trackingNumber };
  }

  async unloadStatus(manifestId: string) {
    const parcels = await prisma.manifestParcel.findMany({
      where: { manifestId },
      include: { package: { select: { trackingNumber: true } } },
    });
    const unloaded = parcels.filter((p) => p.unloadedAt).length;
    const missing = parcels.filter((p) => !p.unloadedAt).map((p) => p.package.trackingNumber);
    return {
      expected: parcels.length,
      unloaded,
      missing,
      complete: parcels.length > 0 && unloaded === parcels.length,
    };
  }

  private async resolvePackage(packageId?: string, trackingNumber?: string) {
    if (packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: packageId } });
      if (!pkg) throw ApiError.notFound('Package not found');
      return pkg;
    }
    if (!trackingNumber?.trim()) throw ApiError.badRequest('packageId or trackingNumber is required');
    const code = trackingNumber.trim();
    const pkg = await prisma.package.findFirst({
      where: { OR: [{ trackingNumber: code }, { barcode: code }] },
    });
    if (!pkg) throw ApiError.notFound('No parcel found for that tracking number');
    return pkg;
  }
}

export const manifestsService = new ManifestsService();
