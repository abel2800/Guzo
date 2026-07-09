import crypto from 'node:crypto';
import { prisma, type Prisma } from '@delivery/database';
import { generateReference, generateTrackingNumber } from '@delivery/utils';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta } from '../../utils/ApiResponse.js';
import { ROLES } from '../../constants/index.js';
import { env } from '../../config/env.js';
import { storage } from '../../providers/storage/index.js';
import { paymentProvider } from '../../providers/payment/index.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';
import { assignPickupCodes, verifyPickup } from './pickup-code.service.js';
import type { PodFile } from '../orders/orders.service.js';
import { writeActivity } from '../../utils/activity.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';

type AuthUser = { id: string; roles: string[] };

export interface BranchRegisterInput {
  senderPhone: string;
  senderName?: string;
  receiverPhone: string;
  receiverName?: string;
  receiverGuzoId?: string;
  destinationBranchId?: string;
  dropoffLine1?: string;
  dropoffCity: string;
  weightKg?: number;
  description?: string;
  fragile?: boolean;
  paymentMethod?: string;
}

const TERMINAL_ORDER = new Set(['DELIVERED', 'CANCELLED', 'RETURNED']);

export class BranchOpsService {
  private newId() {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  }

  async assertBranchAccess(user: AuthUser, branchId: string) {
    const branch = await prisma.guzoBranch.findUnique({ where: { id: branchId } });
    if (!branch) throw ApiError.notFound('Branch not found');
    if (user.roles.includes(ROLES.ADMIN) || user.roles.includes(ROLES.SUPER_ADMIN)) return;
    if (!user.roles.includes(ROLES.BRANCH_STAFF)) {
      throw ApiError.forbidden('Branch staff access required');
    }
    const assigned = await prisma.guzoBranchStaff.findFirst({
      where: { userId: user.id, branchId },
    });
    if (!assigned) throw ApiError.forbidden('You are not assigned to this branch');
  }

  private async findPackageByTracking(trackingNumber: string) {
    const code = trackingNumber?.trim();
    if (!code) throw ApiError.badRequest('trackingNumber is required');
    const pkg = await prisma.package.findFirst({
      where: { OR: [{ trackingNumber: code }, { barcode: code }] },
      include: {
        order: {
          include: {
            dropoffAddress: true,
            payment: true,
            customer: { select: { userId: true } },
          },
        },
      },
    });
    if (!pkg) throw ApiError.notFound('No parcel found for that tracking number');
    return pkg;
  }

  private parseWeight(raw?: string | number | null): number | null {
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0) throw ApiError.badRequest('Invalid weightKg');
    return n;
  }

  private resolveReceiveStatus(order: { destinationBranchId: string | null; originBranchId: string | null; pickupMethod: string | null }, branchId: string) {
    if (branchId === order.destinationBranchId) return 'AT_DESTINATION_BRANCH' as const;
    return 'AT_BRANCH' as const;
  }

  private enrichPayment(order: { payment?: { method: string; status: string; amount: Prisma.Decimal } | null }, target: Record<string, unknown>) {
    if (!order.payment) return;
    target.paymentMethod = order.payment.method;
    if (order.payment.method === 'CASH_ON_DELIVERY' && order.payment.status === 'PENDING') {
      target.codAmount = Number(order.payment.amount);
      target.requiresCod = true;
    }
  }

  private async toInventoryDto(
    inv: {
      id: string;
      shelfCode: string | null;
      zone: string | null;
      receivedAt: Date;
      pickedUpAt: Date | null;
      measuredWeightKg: Prisma.Decimal | null;
      branchId: string;
    } | null,
    pkg: Awaited<ReturnType<typeof this.findPackageByTracking>> | null,
    photoUrl?: string,
  ) {
    const dto: Record<string, unknown> = {};
    if (inv) {
      const branch = await prisma.guzoBranch.findUnique({ where: { id: inv.branchId } });
      dto.id = inv.id;
      dto.shelfCode = inv.shelfCode;
      dto.zone = inv.zone;
      dto.receivedAt = inv.receivedAt;
      dto.pickedUpAt = inv.pickedUpAt;
      dto.measuredWeightKg = inv.measuredWeightKg != null ? Number(inv.measuredWeightKg) : null;
      if (photoUrl) dto.photoUrl = photoUrl;
      if (branch) dto.branch = { id: branch.id, code: branch.code, name: branch.name };
    }
    if (pkg) {
      const orderDto: Record<string, unknown> = {
        id: pkg.order.id,
        orderNumber: pkg.order.orderNumber,
        status: pkg.order.status,
        receiverPhone: pkg.order.receiverPhone,
      };
      if (pkg.order.dropoffAddress) {
        orderDto.dropoffAddress = {
          city: pkg.order.dropoffAddress.city,
          line1: pkg.order.dropoffAddress.line1,
          contactName: pkg.order.dropoffAddress.contactName ?? '',
        };
      }
      this.enrichPayment(pkg.order, orderDto);
      dto.package = {
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        status: pkg.status,
        pickupPin: pkg.pickupPin,
        description: pkg.description,
        weightKg: Number(pkg.weightKg),
        order: orderDto,
      };
    }
    return dto;
  }

  async receive(branchId: string, input: Record<string, string | undefined>, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const pkg = await this.findPackageByTracking(input.trackingNumber!);
    const order = pkg.order;
    const now = new Date();
    let nextStatus: 'AT_BRANCH' | 'AT_DESTINATION_BRANCH' | 'READY_FOR_PICKUP' = this.resolveReceiveStatus(order, branchId);

    await prisma.$transaction(async (tx) => {
      if (!TERMINAL_ORDER.has(order.status)) {
        await tx.order.update({ where: { id: order.id }, data: { status: nextStatus } });
        if (nextStatus === 'AT_DESTINATION_BRANCH') {
          nextStatus = 'READY_FOR_PICKUP';
          await tx.order.update({ where: { id: order.id }, data: { status: 'READY_FOR_PICKUP' } });
        }
      }

      const weight = this.parseWeight(input.weightKg);
      await tx.package.update({
        where: { id: pkg.id },
        data: {
          status: nextStatus === 'AT_BRANCH' || nextStatus === 'AT_DESTINATION_BRANCH' || nextStatus === 'READY_FOR_PICKUP' ? 'AT_BRANCH' : 'IN_TRANSIT',
          ...(weight != null ? { weightKg: weight } : {}),
          ...(input.description?.trim() ? { description: input.description.trim() } : {}),
        },
      });

      await tx.trackingEvent.create({
        data: {
          orderId: order.id,
          type: 'ARRIVED_AT_BRANCH',
          status: nextStatus,
          description: input.note ?? 'Received at branch',
          createdById: user.id,
        },
      });

      const existing = await tx.guzoBranchInventory.findUnique({ where: { packageId: pkg.id } });
      const invData = {
        branchId,
        shelfCode: input.shelfCode ?? null,
        zone: input.zone ?? null,
        measuredWeightKg: weight,
        receivedAt: now,
        pickedUpAt: null,
        updatedAt: now,
      };
      if (existing) {
        await tx.guzoBranchInventory.update({ where: { id: existing.id }, data: invData });
      } else {
        await tx.guzoBranchInventory.create({
          data: { id: this.newId(), packageId: pkg.id, createdAt: now, ...invData },
        });
      }
    });

    const inv = await prisma.guzoBranchInventory.findUnique({ where: { packageId: pkg.id } });
    const refreshed = await this.findPackageByTracking(pkg.trackingNumber);
    await writeActivity({
      userId: user.id,
      action: 'branch.receive',
      metadata: { branchId, trackingNumber: pkg.trackingNumber },
    });
    return this.toInventoryDto(inv, refreshed);
  }

  async receiveIntake(
    branchId: string,
    input: Record<string, string | undefined>,
    photo: PodFile | undefined,
    user: AuthUser,
  ) {
    const result = await this.receive(branchId, input, user);
    if (!photo) return result;

    const pkg = await this.findPackageByTracking(input.trackingNumber!);
    const stored = await storage.save({
      absolutePath: photo.path,
      folder: UPLOAD_FOLDERS.PARCEL_IMAGES,
      filename: photo.filename,
    });

    const file = await prisma.file.create({
      data: {
        uploaderId: user.id,
        category: 'PARCEL_IMAGE',
        originalName: photo.originalname,
        storedName: photo.filename,
        mimeType: photo.mimetype,
        sizeBytes: photo.size,
        storageKey: stored.storageKey,
        storageDriver: stored.driver,
        packageId: pkg.id,
      },
    });

    await prisma.guzoBranchInventory.update({
      where: { packageId: pkg.id },
      data: { photoFileId: file.id, updatedAt: new Date() },
    });

    const photoUrl = `${env.publicUrl}/static/${stored.storageKey.replace(/^uploads\//, '')}`;
    const inv = await prisma.guzoBranchInventory.findUnique({ where: { packageId: pkg.id } });
    const refreshed = await this.findPackageByTracking(pkg.trackingNumber);
    return this.toInventoryDto(inv, refreshed, photoUrl);
  }

  async getLabel(branchId: string, trackingNumber: string, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const pkg = await this.findPackageByTracking(trackingNumber);
    const branch = await prisma.guzoBranch.findUniqueOrThrow({ where: { id: branchId } });
    const label: Record<string, unknown> = {
      trackingNumber: pkg.trackingNumber,
      orderNumber: pkg.order.orderNumber,
      pickupPin: pkg.pickupPin,
      qrCode: pkg.qrCode,
      weightKg: Number(pkg.weightKg),
      description: pkg.description,
      branch: { code: branch.code, name: branch.name, city: branch.city },
      receiverPhone: pkg.order.receiverPhone,
      status: pkg.order.status,
    };
    this.enrichPayment(pkg.order, label);
    return label;
  }

  async registerParcel(branchId: string, req: BranchRegisterInput, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const branch = await prisma.guzoBranch.findUniqueOrThrow({ where: { id: branchId } });

    if (!req.senderPhone?.trim()) throw ApiError.badRequest('Sender phone is required');
    const sender = await prisma.user.findFirst({ where: { phone: req.senderPhone.trim() } });
    if (!sender) throw ApiError.badRequest('Sender must have a GUZO account with this phone number');
    const customer = await prisma.customer.findUnique({ where: { userId: sender.id } });
    if (!customer) throw ApiError.badRequest('Sender is not registered as a customer');

    const weight = req.weightKg ?? 1;
    const orderNumber = generateReference('ORD');
    const trackingNumber = generateTrackingNumber();
    const paymentReference = generateReference('PAY');
    const method = (req.paymentMethod?.toUpperCase() as 'CASH_ON_DELIVERY' | 'FAKE') ?? 'CASH_ON_DELIVERY';
    const charge = await paymentProvider.charge({
      amount: 50 + weight * 5,
      currency: 'ETB',
      reference: paymentReference,
      description: `Payment for order ${orderNumber}`,
    });
    const paid = charge.status === 'PAID';
    const now = new Date();

    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          orderNumber,
          customer: { connect: { id: customer.id } },
          deliveryType: 'STANDARD',
          status: paid ? 'CONFIRMED' : 'PENDING_PAYMENT',
          pickupMethod: 'DROP_AT_BRANCH',
          originBranchId: branchId,
          destinationBranchId: req.destinationBranchId ?? null,
          receiverPhone: req.receiverPhone,
          receiverGuzoId: req.receiverGuzoId ?? null,
          baseFee: 50,
          weightFee: weight * 5,
          totalAmount: 50 + weight * 5,
          currency: 'ETB',
          pickupAddress: {
            create: {
              type: 'PICKUP' as const,
              line1: branch.line1,
              city: branch.city,
              state: branch.state,
              country: branch.country,
              latitude: branch.latitude,
              longitude: branch.longitude,
              contactName: req.senderName ?? sender.firstName ?? 'Sender',
              contactPhone: req.senderPhone,
            },
          },
          dropoffAddress: {
            create: {
              type: 'DROPOFF' as const,
              line1: req.dropoffLine1?.trim() || req.dropoffCity,
              city: req.dropoffCity,
              country: 'ET',
              contactName: req.receiverName ?? 'Receiver',
              contactPhone: req.receiverPhone,
            },
          },
          packages: {
            create: {
              trackingNumber,
              description: req.description,
              weightKg: weight,
              isFragile: req.fragile ?? false,
              barcode: trackingNumber,
              status: 'CREATED',
            },
          },
          payment: {
            create: {
              reference: paymentReference,
              provider: charge.provider,
              providerRef: charge.providerRef,
              method,
              status: method === 'CASH_ON_DELIVERY' ? 'PENDING' : charge.status,
              amount: 50 + weight * 5,
              currency: 'ETB',
              paidAt: paid ? now : undefined,
            },
          },
        },
        include: { packages: true },
      });
    });

    await assignPickupCodes(order.packages[0]!.id);

    const receiveResult = await this.receive(
      branchId,
      {
        trackingNumber,
        weightKg: String(weight),
        description: req.description,
      },
      user,
    );
    const label = await this.getLabel(branchId, trackingNumber, user);
    await writeActivity({
      userId: user.id,
      action: 'branch.register',
      metadata: { branchId, trackingNumber, orderNumber: order.orderNumber },
    });

    eventBus.publish(DOMAIN_EVENTS.ORDER_CREATED, { orderId: order.id, orderNumber: order.orderNumber });
    if (paid) eventBus.publish(DOMAIN_EVENTS.PAYMENT_SUCCEEDED, { orderId: order.id });

    return { ...receiveResult, label };
  }

  async assignShelf(branchId: string, input: { trackingNumber: string; shelfCode: string; zone?: string }, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const pkg = await this.findPackageByTracking(input.trackingNumber);
    const inv = await prisma.guzoBranchInventory.findUnique({ where: { packageId: pkg.id } });
    if (!inv) throw ApiError.badRequest('Parcel is not in branch inventory');
    if (inv.branchId !== branchId) throw ApiError.badRequest('Parcel belongs to another branch');
    if (inv.pickedUpAt) throw ApiError.badRequest('Parcel already picked up');

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.guzoBranchInventory.update({
        where: { id: inv.id },
        data: { shelfCode: input.shelfCode, zone: input.zone ?? inv.zone, updatedAt: new Date() },
      });
      await tx.trackingEvent.create({
        data: {
          orderId: pkg.orderId,
          type: 'SORTED',
          status: 'Sorted',
          description: `Shelf ${input.shelfCode}`,
          createdById: user.id,
        },
      });
      return row;
    });

    const refreshed = await this.findPackageByTracking(pkg.trackingNumber);
    await writeActivity({
      userId: user.id,
      action: 'branch.assign_shelf',
      metadata: { branchId, trackingNumber: pkg.trackingNumber, shelfCode: input.shelfCode },
    });
    return this.toInventoryDto(updated, refreshed);
  }

  async confirmPickup(
    branchId: string,
    input: { reference: string; pin?: string; collectCod?: string | boolean },
    user: AuthUser,
  ) {
    await this.assertBranchAccess(user, branchId);
    const pkg = await verifyPickup(input.reference, input.pin);
    const inv = await prisma.guzoBranchInventory.findUnique({ where: { packageId: pkg.id } });
    if (inv && inv.branchId !== branchId) {
      throw ApiError.badRequest('Parcel is stored at a different branch');
    }

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: pkg.orderId },
      include: { payment: true },
    });
    if (order.destinationBranchId && order.destinationBranchId !== branchId) {
      throw ApiError.badRequest('Parcel is not assigned to this destination branch');
    }

    const collectCod = input.collectCod === true || input.collectCod === 'true';
    const now = new Date();

    if (
      order.payment?.method === 'CASH_ON_DELIVERY' &&
      order.payment.status === 'PENDING' &&
      !collectCod
    ) {
      throw ApiError.badRequest('Collect COD cash before confirming pickup');
    }

    await prisma.$transaction(async (tx) => {
      if (collectCod && order.payment?.method === 'CASH_ON_DELIVERY' && order.payment.status === 'PENDING') {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: 'PAID', paidAt: now },
        });
      }
      let status = order.status;
      if (status === 'AT_DESTINATION_BRANCH') status = 'READY_FOR_PICKUP';
      await tx.order.update({ where: { id: order.id }, data: { status: 'DELIVERED', deliveredAt: now } });
      await tx.package.update({ where: { id: pkg.id }, data: { status: 'DELIVERED' } });
      await tx.trackingEvent.create({
        data: {
          orderId: order.id,
          type: 'DELIVERED',
          status: 'Delivered',
          description: 'Picked up at branch',
          createdById: user.id,
        },
      });
      if (inv) {
        await tx.guzoBranchInventory.update({
          where: { id: inv.id },
          data: { pickedUpAt: now, updatedAt: now },
        });
      }
    });

    const refreshedInv = inv ? await prisma.guzoBranchInventory.findUnique({ where: { id: inv.id } }) : null;
    const refreshedPkg = await this.findPackageByTracking(pkg.trackingNumber);
    await writeActivity({
      userId: user.id,
      action: 'branch.pickup',
      metadata: { branchId, trackingNumber: pkg.trackingNumber },
    });
    return this.toInventoryDto(refreshedInv, refreshedPkg);
  }

  async markException(branchId: string, input: { trackingNumber: string; reason?: string }, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const pkg = await this.findPackageByTracking(input.trackingNumber);
    const order = pkg.order;
    const reason = (input.reason ?? 'RETURNED').toUpperCase();
    const now = new Date();

    if (!['DELIVERED', 'CANCELLED'].includes(order.status)) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: 'RETURNED' } });
        await tx.package.update({ where: { id: pkg.id }, data: { status: 'RETURNED' } });
        await tx.trackingEvent.create({
          data: {
            orderId: order.id,
            type: 'RETURNED',
            status: 'Returned',
            description: `Branch exception: ${reason}`,
            createdById: user.id,
          },
        });
      });
    }

    const inv = await prisma.guzoBranchInventory.findUnique({ where: { packageId: pkg.id } });
    const refreshed = await this.findPackageByTracking(pkg.trackingNumber);
    await writeActivity({
      userId: user.id,
      action: 'branch.exception',
      metadata: { branchId, trackingNumber: pkg.trackingNumber, reason },
    });
    return this.toInventoryDto(inv, refreshed);
  }

  async listInventory(branchId: string, page: number, limit: number, state: string, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const skip = (Math.max(page, 1) - 1) * Math.max(limit, 1);
    const take = Math.max(limit, 1);
    const where =
      state === 'all'
        ? { branchId }
        : { branchId, pickedUpAt: null };

    const [rows, total] = await Promise.all([
      prisma.guzoBranchInventory.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip,
        take,
      }),
      prisma.guzoBranchInventory.count({ where }),
    ]);

    const items = await Promise.all(
      rows.map(async (inv) => {
        const pkg = await prisma.package.findUnique({
          where: { id: inv.packageId },
          include: {
            order: { include: { dropoffAddress: true, payment: true } },
          },
        });
        return this.toInventoryDto(inv, pkg as Awaited<ReturnType<typeof this.findPackageByTracking>> | null);
      }),
    );

    return { items, meta: buildMeta(page, limit, total) };
  }

  async lookupShelf(branchId: string, shelfCode: string, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const rows = await prisma.guzoBranchInventory.findMany({
      where: { branchId, shelfCode: { equals: shelfCode, mode: 'insensitive' }, pickedUpAt: null },
    });
    return Promise.all(
      rows.map(async (inv) => {
        const pkg = await prisma.package.findUnique({
          where: { id: inv.packageId },
          include: { order: { include: { dropoffAddress: true, payment: true } } },
        });
        return this.toInventoryDto(inv, pkg as Awaited<ReturnType<typeof this.findPackageByTracking>> | null);
      }),
    );
  }

  async stats(branchId: string, user: AuthUser) {
    await this.assertBranchAccess(user, branchId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [inStock, incomingToday, pickedUpToday, readyForPickup, outgoing] = await Promise.all([
      prisma.guzoBranchInventory.count({ where: { branchId, pickedUpAt: null } }),
      prisma.guzoBranchInventory.count({ where: { branchId, receivedAt: { gte: startOfDay } } }),
      prisma.guzoBranchInventory.count({ where: { branchId, pickedUpAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { destinationBranchId: branchId, status: 'READY_FOR_PICKUP' } }),
      prisma.order.count({
        where: {
          originBranchId: branchId,
          status: { in: ['IN_TRANSIT', 'AT_WAREHOUSE', 'OUT_FOR_DELIVERY'] },
        },
      }),
    ]);

    return {
      totals: { inStock, incomingToday, outgoing, readyForPickup, pickedUpToday },
    };
  }
}

export const branchOpsService = new BranchOpsService();
