import { prisma } from '@delivery/database';
import { haversineKm } from '@delivery/utils';
import { ApiError } from '../../utils/ApiError.js';
import { manifestsService } from '../manifests/manifests.service.js';
import { storage } from '../../providers/storage/index.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';
import { filePublicUrl } from '../../utils/file-url.js';

export class DriverOpsService {
  private async requireDriver(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');
    return driver;
  }

  private async assertManifestDriver(manifestId: string, driverId: string) {
    const manifest = await prisma.transportManifest.findUnique({ where: { id: manifestId } });
    if (!manifest) throw ApiError.notFound('Manifest not found');
    if (manifest.driverId !== driverId) {
      throw ApiError.forbidden('This manifest is not assigned to you');
    }
    return manifest;
  }

  async listManifests(userId: string) {
    const driver = await this.requireDriver(userId);
    const rows = await prisma.transportManifest.findMany({
      where: { driverId: driver.id, status: { in: ['DRAFT', 'SEALED', 'IN_TRANSIT', 'ARRIVED'] } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { parcels: true } } },
    });
    return rows.map((m) => ({
      id: m.id,
      manifestNumber: m.manifestNumber,
      status: m.status,
      sealNumber: m.sealNumber,
      originWarehouseId: m.originWarehouseId,
      destinationWarehouseId: m.destinationWarehouseId,
      parcelCount: m._count.parcels,
      departedAt: m.departedAt,
      arrivedAt: m.arrivedAt,
    }));
  }

  async getManifest(userId: string, manifestId: string) {
    const driver = await this.requireDriver(userId);
    await this.assertManifestDriver(manifestId, driver.id);
    return manifestsService.getDetail(manifestId);
  }

  async scanManifest(userId: string, manifestId: string, trackingNumber: string) {
    const driver = await this.requireDriver(userId);
    await this.assertManifestDriver(manifestId, driver.id);
    return manifestsService.scanParcel(manifestId, { trackingNumber, scannedByUserId: userId });
  }

  async departManifest(userId: string, manifestId: string, sealNumber?: string) {
    const driver = await this.requireDriver(userId);
    await this.assertManifestDriver(manifestId, driver.id);
    return manifestsService.depart(manifestId, sealNumber ?? `SEAL-${Date.now()}`);
  }

  async arriveManifest(userId: string, manifestId: string) {
    const driver = await this.requireDriver(userId);
    await this.assertManifestDriver(manifestId, driver.id);
    return manifestsService.arrive(manifestId);
  }

  async unloadManifest(userId: string, manifestId: string, trackingNumber: string) {
    const driver = await this.requireDriver(userId);
    await this.assertManifestDriver(manifestId, driver.id);
    return manifestsService.unloadScan(manifestId, trackingNumber);
  }

    async getEarnings(userId: string) {
    const driver = await this.requireDriver(userId);
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: driver.userId, type: 'CREDIT' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      balance: Number(driver.earningsBalance),
      totalDeliveries: driver.totalDeliveries,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        currency: t.currency,
        reference: t.reference,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

    async getMyVehicle(userId: string) {
    const driver = await this.requireDriver(userId);
    const vehicle = await prisma.vehicle.findFirst({
      where: { driverId: driver.id },
      orderBy: { updatedAt: 'desc' },
    });
    if (!vehicle) return null;
    const photoFile = vehicle.photoFileId
      ? await prisma.file.findUnique({ where: { id: vehicle.photoFileId } })
      : null;
    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      status: vehicle.status,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      photoUrl: filePublicUrl(photoFile?.storageKey),
    };
  }

  async upsertMyVehicle(
    userId: string,
    input: {
      type: string;
      plateNumber: string;
      brand?: string;
      model?: string;
      color?: string;
    },
  ) {
    const driver = await this.requireDriver(userId);
    const plate = input.plateNumber.trim().toUpperCase();
    if (!plate) throw ApiError.badRequest('Plate number is required');

    const existing = await prisma.vehicle.findFirst({ where: { driverId: driver.id } });
    const data = {
      type: input.type as never,
      plateNumber: plate,
      brand: input.brand?.trim() || null,
      model: input.model?.trim() || null,
      color: input.color?.trim() || null,
      status: 'ACTIVE' as const,
    };

    const vehicle = existing
      ? await prisma.vehicle.update({ where: { id: existing.id }, data })
      : await prisma.vehicle.create({ data: { ...data, driverId: driver.id } });

    const photoFile = vehicle.photoFileId
      ? await prisma.file.findUnique({ where: { id: vehicle.photoFileId } })
      : null;

    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      status: vehicle.status,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      photoUrl: filePublicUrl(photoFile?.storageKey),
    };
  }

  async uploadVehiclePhoto(
    userId: string,
    file: { path: string; filename: string; originalname: string; mimetype: string; size: number },
  ) {
    const driver = await this.requireDriver(userId);
    let vehicle = await prisma.vehicle.findFirst({ where: { driverId: driver.id } });
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          driverId: driver.id,
          type: 'MOTORCYCLE',
          plateNumber: `TMP-${driver.driverCode}`,
          status: 'ACTIVE',
        },
      });
    }

    const saved = await storage.save({
      absolutePath: file.path,
      folder: UPLOAD_FOLDERS.VEHICLE_PHOTOS,
      filename: file.filename,
    });

    const fileRow = await prisma.file.create({
      data: {
        uploaderId: userId,
        category: 'IMAGE',
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: saved.storageKey,
        storageDriver: saved.driver,
      },
    });

    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { photoFileId: fileRow.id },
    });

    return {
      id: updated.id,
      plateNumber: updated.plateNumber,
      type: updated.type,
      status: updated.status,
      brand: updated.brand,
      model: updated.model,
      color: updated.color,
      photoUrl: filePublicUrl(saved.storageKey),
    };
  }

    async createVehicleLog(
    userId: string,
    input: {
      type: 'FUEL' | 'MAINTENANCE' | 'MILEAGE' | 'INSPECTION';
      odometerKm?: number;
      amount?: number;
      note?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const driver = await this.requireDriver(userId);
    const vehicle = await prisma.vehicle.findFirst({ where: { driverId: driver.id } });
    if (!vehicle) throw ApiError.badRequest('No vehicle assigned to your driver profile');

    const log = await prisma.vehicleLog.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        type: input.type,
        odometerKm: input.odometerKm,
        amount: input.amount,
        note: input.note,
        metadata: input.metadata as object | undefined,
      },
    });
    return {
      id: log.id,
      type: log.type,
      odometerKm: log.odometerKm != null ? Number(log.odometerKm) : null,
      amount: log.amount != null ? Number(log.amount) : null,
      note: log.note,
      loggedAt: log.loggedAt.toISOString(),
    };
  }

  async listVehicleLogs(userId: string, limit = 30) {
    const driver = await this.requireDriver(userId);
    const logs = await prisma.vehicleLog.findMany({
      where: { driverId: driver.id },
      orderBy: { loggedAt: 'desc' },
      take: limit,
    });
    return logs.map((l) => ({
      id: l.id,
      type: l.type,
      odometerKm: l.odometerKm != null ? Number(l.odometerKm) : null,
      amount: l.amount != null ? Number(l.amount) : null,
      note: l.note,
      loggedAt: l.loggedAt.toISOString(),
    }));
  }

    async optimizedRoute(userId: string) {
    const driver = await this.requireDriver(userId);
    const deliveries = await prisma.delivery.findMany({
      where: { driverId: driver.id, deliveredAt: null },
      include: {
        order: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
          },
        },
      },
    });

    type Stop = {
      orderId: string;
      orderNumber: string;
      type: 'pickup' | 'dropoff';
      line1: string;
      city: string;
      latitude: number | null;
      longitude: number | null;
    };

    const candidates: Stop[] = [];
    for (const d of deliveries) {
      const o = d.order;
      if (!o) continue;
      const pickupStatuses = ['ASSIGNED', 'CONFIRMED', 'PICKED_UP'];
      const dropStatuses = ['OUT_FOR_DELIVERY', 'IN_TRANSIT'];
      if (pickupStatuses.includes(o.status)) {
        candidates.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          type: 'pickup',
          line1: o.pickupAddress.line1,
          city: o.pickupAddress.city,
          latitude: o.pickupAddress.latitude,
          longitude: o.pickupAddress.longitude,
        });
      }
      if (dropStatuses.includes(o.status)) {
        candidates.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          type: 'dropoff',
          line1: o.dropoffAddress.line1,
          city: o.dropoffAddress.city,
          latitude: o.dropoffAddress.latitude,
          longitude: o.dropoffAddress.longitude,
        });
      }
    }

    const withCoords = candidates.filter((s) => s.latitude != null && s.longitude != null);
    const withoutCoords = candidates.filter((s) => s.latitude == null || s.longitude == null);

    let originLat = driver.currentLat;
    let originLng = driver.currentLng;
    if ((originLat == null || originLng == null) && withCoords.length > 0) {
      originLat = withCoords[0].latitude!;
      originLng = withCoords[0].longitude!;
    }

    const ordered: Stop[] = [];
    const remaining = [...withCoords];
    let curLat = originLat;
    let curLng = originLng;
    let totalKm = 0;

    while (remaining.length > 0 && curLat != null && curLng != null) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const s = remaining[i];
        const dist = haversineKm(
          { lat: curLat, lng: curLng },
          { lat: s.latitude!, lng: s.longitude! },
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      totalKm += bestDist === Infinity ? 0 : bestDist;
      ordered.push(next);
      curLat = next.latitude;
      curLng = next.longitude;
    }

    const stops = [...ordered, ...withoutCoords];

    return {
      stops,
      totalStops: stops.length,
      estimatedKm: Math.round(totalKm * 100) / 100,
    };
  }
}

export const driverOpsService = new DriverOpsService();
