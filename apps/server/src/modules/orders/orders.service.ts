import { ordersRepository, OrdersRepository } from './orders.repository.js';
import { prisma } from '@delivery/database';
import type { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto } from './orders.dto.js';
import type { PriceBreakdown } from './orders.types.js';
import { ORDER_MESSAGES, ORDER_SORTABLE_FIELDS } from './orders.constants.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import { generateReference, generateTrackingNumber } from '@delivery/utils';
import { osrmProvider } from '../../providers/maps/osrm.provider.js';
import { resolveAddressCoords } from '../../providers/maps/resolve-address.js';
import { paymentProvider } from '../../providers/payment/index.js';
import { storage } from '../../providers/storage/index.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { emitToOrder, emitToAdmins, emitToUser } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';
import { dispatchMerchantEvent } from '../merchant-platform/webhook-dispatcher.js';
import { loyaltyService } from '../loyalty/loyalty.service.js';
import { writeActivity } from '../../utils/activity.js';
import { customerOrderAccessFilter } from '../customers/customer-link.service.js';
import { normalizePhone, phoneLookupVariants } from '../../utils/phone.js';
import { assignPickupCodes, verifyPickup } from '../branches/pickup-code.service.js';
import { notifyReceiver, trackUrl } from './order-notifications.js';

export interface CreateOrderContext {
  userId: string;
  isAdmin: boolean;
  isMerchant?: boolean;
}

export interface PodFile {
  path: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

export class OrdersService {
  constructor(private readonly repo: OrdersRepository = ordersRepository) {}

  async list(
    query: ParsedListQuery,
    scope?: {
      customerId?: string;
      customerUserId?: string;
      customerOrderScope?: 'sent' | 'incoming' | 'all';
      customerPhone?: string | null;
      driverUserId?: string;
      merchantUserId?: string;
      unassigned?: boolean;
    },
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const sortBy = ORDER_SORTABLE_FIELDS.includes(query.sortBy as never) ? query.sortBy : 'createdAt';

    let customerId: string | undefined = scope?.customerId ?? query.filters.customerId;
    let customerAccess: ReturnType<typeof customerOrderAccessFilter> | undefined;
    if (scope?.customerUserId && !scope.merchantUserId) {
      const customer = await this.repo.customerByUserId(scope.customerUserId);
      customerId = customer?.id;
      const user = await prisma.user.findUnique({
        where: { id: scope.customerUserId },
        select: { phone: true },
      });
      customerAccess = customerOrderAccessFilter({
        customerId: customer?.id,
        userId: scope.customerUserId,
        phone: scope.customerPhone ?? user?.phone,
        scope: scope.customerOrderScope ?? 'sent',
      });
      customerId = undefined;
    }

    let driverId: string | undefined;
    if (scope?.driverUserId && !scope.unassigned) {
      const driver = await this.repo.driverByUserId(scope.driverUserId);
      driverId = driver?.id ?? '__no_driver__';
    }

    let merchantId = query.filters.merchantId;
    if (scope?.merchantUserId) {
      const merchant = await this.repo.merchantByUserId(scope.merchantUserId);
      merchantId = merchant?.id ?? '__no_merchant__';
    }

    const { items, total } = await this.repo.list({
      skip: query.skip,
      take: query.take,
      search: query.search,
      status: query.filters.status,
      customerId,
      customerAccess,
      merchantId,
      driverId,
      unassigned: scope?.unassigned,
      sortBy,
      sortOrder: query.sortOrder,
    });
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  async completeWithProof(
    orderId: string,
    userId: string,
    input: {
      photo: PodFile;
      signature?: PodFile;
      recipientName?: string;
      note?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
    if (order.status === 'DELIVERED') throw ApiError.badRequest('Order is already delivered');

    const photoRow = await this.saveProofFile(userId, input.photo, 'PROOF_OF_DELIVERY');
    const signatureRow = input.signature
      ? await this.saveProofFile(userId, input.signature, 'SIGNATURE')
      : null;

    await this.repo.updateDelivery(orderId, {
      proofFile: { connect: { id: photoRow.id } },
      ...(signatureRow ? { signatureFile: { connect: { id: signatureRow.id } } } : {}),
      recipientName: input.recipientName,
      deliveredAt: new Date(),
    });

    await writeActivity({
      userId,
      action: 'driver.pod',
      metadata: { orderId, orderNumber: order.orderNumber, hasSignature: !!signatureRow },
    });

    return this.updateStatus(orderId, {
      status: 'DELIVERED',
      note: input.note ?? (input.recipientName ? `Delivered to ${input.recipientName}` : 'Delivered'),
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }

  async confirmPickupWithProof(
    orderId: string,
    userId: string,
    input: {
      photo: PodFile;
      signature?: PodFile;
      note?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
    if (!['ASSIGNED', 'CONFIRMED'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot confirm pickup when order is ${order.status}`);
    }

    const photoRow = await this.saveProofFile(userId, input.photo, 'PROOF_OF_DELIVERY');
    if (input.signature) await this.saveProofFile(userId, input.signature, 'SIGNATURE');

    const pkg = order.packages?.[0];
    if (pkg) {
      await this.repo.client.file.update({
        where: { id: photoRow.id },
        data: { packageId: pkg.id, category: 'PARCEL_IMAGE' },
      });
    }

    await writeActivity({
      userId,
      action: 'driver.pickup_proof',
      metadata: { orderId, orderNumber: order.orderNumber, hasSignature: !!input.signature },
    });

    return this.updateStatus(orderId, {
      status: 'PICKED_UP',
      note: input.note ?? 'Picked up with photo proof',
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }

  async scanPickup(
    orderId: string,
    userId: string,
    input: { reference: string; latitude?: number; longitude?: number },
  ) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
    if (!['ASSIGNED', 'AT_BRANCH'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot scan pickup when order is ${order.status}`);
    }

    const pkg = await verifyPickup(input.reference.trim());
    if (pkg.orderId !== orderId) {
      throw ApiError.badRequest('Scanned parcel does not match this delivery');
    }

    await writeActivity({
      userId,
      action: 'driver.scan_pickup',
      metadata: { orderId, orderNumber: order.orderNumber, trackingNumber: pkg.trackingNumber },
    });

    return this.updateStatus(orderId, {
      status: 'PICKED_UP',
      note: `Parcel scanned at pickup (${pkg.trackingNumber})`,
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }

  async notifyDriverArrived(
    orderId: string,
    userId: string,
    input: { latitude?: number; longitude?: number },
  ) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
    if (!['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(order.status)) {
      throw ApiError.badRequest('Arrival can only be reported while en route to the receiver');
    }

    const driverRow = order.delivery.driverId
      ? await this.repo.client.driver.findUnique({
          where: { id: order.delivery.driverId },
          include: { user: { select: { firstName: true, lastName: true } } },
        })
      : null;
    const driverName = driverRow?.user
      ? `${driverRow.user.firstName} ${driverRow.user.lastName}`.trim()
      : 'Your driver';
    const tracking = order.packages?.[0]?.trackingNumber ?? order.orderNumber;
    const dropPhone = order.dropoffAddress?.contactPhone ?? order.receiverPhone;

    await this.repo.addTrackingEvent({
      orderId,
      type: 'OUT_FOR_DELIVERY',
      status: 'Driver arrived',
      description: `${driverName} has arrived. Please come out to collect your parcel.`,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    await notifyReceiver({
      receiverUserId: order.receiverUserId,
      receiverPhone: order.receiverPhone ?? dropPhone,
      type: 'DRIVER_ARRIVED',
      title: 'Driver has arrived',
      body: `${driverName} is at your location with parcel ${tracking}. Please collect your package.`,
    });

    await writeActivity({
      userId,
      action: 'driver.arrived',
      metadata: { orderId, orderNumber: order.orderNumber },
    });

    return this.getById(orderId);
  }

  async branchHandoff(
    orderId: string,
    userId: string,
    input: { branchId: string; trackingNumber: string },
  ) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }

    const pkg = order.packages?.find(
      (p) => p.trackingNumber === input.trackingNumber.trim() || p.barcode === input.trackingNumber.trim(),
    );
    if (!pkg) throw ApiError.badRequest('Tracking number does not match this order');

    const branch = await this.repo.client.guzoBranch.findUnique({ where: { id: input.branchId } });
    if (!branch) throw ApiError.notFound('Branch not found');

    await this.repo.client.package.update({
      where: { id: pkg.id },
      data: { status: 'AT_BRANCH' },
    });

    await writeActivity({
      userId,
      action: 'driver.branch_handoff',
      metadata: { orderId, branchId: input.branchId, trackingNumber: input.trackingNumber },
    });

    return this.updateStatus(orderId, {
      status: 'AT_BRANCH',
      note: `Dropped at branch ${branch.name} (${branch.code})`,
    });
  }

  async markFailed(orderId: string, userId: string, note?: string) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
    if (order.status !== 'OUT_FOR_DELIVERY') {
      throw ApiError.badRequest('Only out-for-delivery orders can be marked failed');
    }

    await writeActivity({
      userId,
      action: 'driver.delivery_failed',
      metadata: { orderId, orderNumber: order.orderNumber, note },
    });

    return this.updateStatus(orderId, {
      status: 'FAILED',
      note: note ?? 'Delivery attempt failed',
    });
  }

  async reattemptDelivery(orderId: string, userId: string) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (!order.delivery || order.delivery.driverId !== driver.id) {
      throw ApiError.forbidden('This delivery is not assigned to you');
    }
    if (order.status !== 'FAILED') {
      throw ApiError.badRequest('Only failed deliveries can be reattempted');
    }

    await writeActivity({
      userId,
      action: 'driver.delivery_reattempt',
      metadata: { orderId, orderNumber: order.orderNumber },
    });

    return this.updateStatus(orderId, {
      status: 'OUT_FOR_DELIVERY',
      note: 'Driver reattempting delivery',
    });
  }

  private async creditDriverEarnings(orderId: string, order: Awaited<ReturnType<typeof this.getById>>) {
    const driverId = order.delivery?.driverId;
    if (!driverId) return;

    const driver = await this.repo.client.driver.findUnique({ where: { id: driverId } });
    if (!driver) return;

    const payout = Math.round(Number(order.totalAmount) * 0.15 * 100) / 100;
    if (payout <= 0) return;

    const newBalance = Number(driver.earningsBalance) + payout;
    await this.repo.client.$transaction([
      this.repo.client.driver.update({
        where: { id: driverId },
        data: {
          earningsBalance: { increment: payout },
          totalDeliveries: { increment: 1 },
        },
      }),
      this.repo.client.walletTransaction.create({
        data: {
          userId: driver.userId,
          type: 'CREDIT',
          amount: payout,
          balanceAfter: newBalance,
          currency: order.currency ?? 'ETB',
          reference: order.orderNumber,
          description: 'Delivery earnings',
        },
      }),
    ]);
  }

  private async saveProofFile(userId: string, file: PodFile, category: 'PROOF_OF_DELIVERY' | 'SIGNATURE') {
    const saved = await storage.save({
      absolutePath: file.path,
      folder: UPLOAD_FOLDERS.PROOF_OF_DELIVERY,
      filename: file.filename,
    });
    return this.repo.createFile({
      uploaderId: userId,
      category,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey: saved.storageKey,
      storageDriver: saved.driver,
    });
  }

  async accept(orderId: string, userId: string) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (order.delivery) throw ApiError.badRequest('This order has already been assigned');
    const acceptable = ['CONFIRMED', 'AT_BRANCH'] as const;
    if (!acceptable.includes(order.status as (typeof acceptable)[number])) {
      throw ApiError.badRequest(`This order cannot be accepted (status is ${order.status})`);
    }

    const vehicle = await this.repo.client.vehicle.findFirst({
      where: { driverId: driver.id, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    });

    const result = await this.assignDriver(orderId, { driverId: driver.id, vehicleId: vehicle?.id });
    await writeActivity({
      userId,
      action: 'driver.accept_job',
      metadata: { orderId, driverId: driver.id },
    });
    return result;
  }

  async getById(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  async track(reference: string) {
    const byOrder = await this.repo.findByNumber(reference);
    if (byOrder) return byOrder;
    const pkg = await this.repo.client.package.findUnique({ where: { trackingNumber: reference } });
    if (!pkg) throw ApiError.notFound('No shipment found for that reference');
    return this.getById(pkg.orderId);
  }

  async createForMerchantId(merchantId: string, dto: CreateOrderDto) {
    const merchant = await this.repo.client.merchant.findUnique({
      where: { id: merchantId },
      select: { userId: true },
    });
    if (!merchant) throw ApiError.notFound('Merchant not found');
    return this.create({ ...dto, merchantId }, { userId: merchant.userId, isAdmin: false, isMerchant: true });
  }

  async create(dto: CreateOrderDto, ctx: CreateOrderContext) {
    let merchantId = dto.merchantId;
    if (ctx.isMerchant && !ctx.isAdmin) {
      const merchant = await this.repo.merchantByUserId(ctx.userId);
      if (!merchant) throw ApiError.badRequest('Authenticated user is not a merchant');
      merchantId = merchant.id;
    }

    let customerId = dto.customerId;
    if (!customerId || !ctx.isAdmin) {
      let customer = await this.repo.customerByUserId(ctx.userId);
      if (!customer && ctx.isMerchant) customer = await this.repo.ensureCustomerForUser(ctx.userId);
      if (!customer) throw ApiError.badRequest('Authenticated user is not a customer');
      customerId = customer.id;
    }

    const deliveryType = dto.deliveryType ?? 'STANDARD';
    const price = await this.quote(dto, deliveryType);

    const pickupCoords = await resolveAddressCoords(dto.pickup);
    const dropoffCoords = await resolveAddressCoords(dto.dropoff);

    const orderNumber = generateReference('ORD');
    const trackingNumber = generateTrackingNumber();
    const invoiceNumber = generateReference('INV');
    const paymentReference = generateReference('PAY');

    const payLater = dto.payLater || dto.paymentMethod?.toUpperCase() === 'PAY_LATER';
    const methodRaw = (dto.paymentMethod ?? 'FAKE').toUpperCase();
    const paymentMethod =
      payLater || methodRaw === 'PAY_LATER'
        ? 'CASH_ON_DELIVERY'
        : (methodRaw as 'FAKE' | 'CASH_ON_DELIVERY' | 'TELEBIRR' | 'CBE' | 'CHAPA' | 'CARD' | 'MOBILE_MONEY');

    let paid = false;
    let provider = 'internal';
    let providerRef = paymentReference;
    if (!payLater && paymentMethod !== 'CASH_ON_DELIVERY') {
      const charge = await paymentProvider.charge({
        amount: price.totalAmount,
        currency: price.currency,
        reference: paymentReference,
        description: `Payment for order ${orderNumber}`,
      });
      paid = charge.status === 'PAID';
      provider = charge.provider;
      providerRef = charge.providerRef;
    }
    const orderStatus = payLater || paymentMethod === 'CASH_ON_DELIVERY' || paid ? 'CONFIRMED' : 'PENDING_PAYMENT';

    const receiverUserId = dto.receiverPhone
      ? (await prisma.user.findFirst({
          where: { phone: { in: phoneLookupVariants(dto.receiverPhone) } },
        }))?.id ?? null
      : null;

    const order = await this.repo.create({
      orderNumber,
      customer: { connect: { id: customerId } },
      ...(merchantId ? { merchant: { connect: { id: merchantId } } } : {}),
      deliveryType,
      status: orderStatus,
      pickupMethod: dto.pickupMethod ?? undefined,
      originBranchId: dto.originBranchId ?? undefined,
      destinationBranchId: dto.destinationBranchId ?? undefined,
      receiverPhone: dto.receiverPhone ? normalizePhone(dto.receiverPhone) : dto.dropoff.contactPhone ?? undefined,
      receiverUserId,
      receiverGuzoId: dto.receiverGuzoId ?? undefined,
      distanceKm: price.distanceKm,
      baseFee: price.baseFee,
      distanceFee: price.distanceFee,
      weightFee: price.weightFee,
      surge: price.surge,
      discount: price.discount,
      tax: price.tax,
      totalAmount: price.totalAmount,
      currency: price.currency,
      notes: dto.notes,
      scheduledPickupAt: dto.scheduledPickupAt ? new Date(dto.scheduledPickupAt) : undefined,
      pickupAddress: {
        create: {
          type: 'PICKUP',
          contactName: dto.pickup.contactName,
          contactPhone: dto.pickup.contactPhone,
          line1: dto.pickup.line1,
          line2: dto.pickup.line2,
          city: dto.pickup.city,
          state: dto.pickup.state,
          postalCode: dto.pickup.postalCode,
          country: dto.pickup.country ?? 'ET',
          latitude: dto.pickup.latitude ?? pickupCoords?.lat,
          longitude: dto.pickup.longitude ?? pickupCoords?.lng,
        },
      },
      dropoffAddress: {
        create: {
          type: 'DROPOFF',
          contactName: dto.dropoff.contactName,
          contactPhone: dto.dropoff.contactPhone,
          line1: dto.dropoff.line1,
          line2: dto.dropoff.line2,
          city: dto.dropoff.city,
          state: dto.dropoff.state,
          postalCode: dto.dropoff.postalCode,
          country: dto.dropoff.country ?? 'ET',
          latitude: dto.dropoff.latitude ?? dropoffCoords?.lat,
          longitude: dto.dropoff.longitude ?? dropoffCoords?.lng,
        },
      },
      packages: {
        create: [
          {
            trackingNumber,
            description: dto.package.description,
            weightKg: dto.package.weightKg,
            lengthCm: dto.package.lengthCm,
            widthCm: dto.package.widthCm,
            heightCm: dto.package.heightCm,
            declaredValue: dto.package.declaredValue,
            isFragile: dto.package.isFragile ?? false,
            barcode: trackingNumber,
            qrCode: trackingNumber,
          },
        ],
      },
      payment: {
        create: {
          reference: paymentReference,
          provider,
          providerRef,
          method: paymentMethod,
          status: paid ? 'PAID' : 'PENDING',
          amount: price.totalAmount,
          currency: price.currency,
          paidAt: paid ? new Date() : undefined,
        },
      },
      invoice: {
        create: {
          invoiceNumber,
          status: paid ? 'PAID' : 'ISSUED',
          subtotal: price.baseFee + price.distanceFee + price.weightFee,
          tax: price.tax,
          discount: price.discount,
          total: price.totalAmount,
          currency: price.currency,
          paidAt: paid ? new Date() : undefined,
        },
      },
      trackingEvents: {
        create: [
          {
            type: 'ORDER_CREATED',
            status: 'Order created',
            description: `Order ${orderNumber} created`,
          },
          ...(paid
            ? [{ type: 'PAYMENT_CONFIRMED' as const, status: 'Payment confirmed', description: 'Payment received' }]
            : []),
        ],
      },
    });

    eventBus.publish(DOMAIN_EVENTS.ORDER_CREATED, { orderId: order.id, orderNumber });
    if (paid) eventBus.publish(DOMAIN_EVENTS.PAYMENT_SUCCEEDED, { orderId: order.id });
    emitToAdmins(SOCKET_EVENTS.ORDER_STATUS, { orderId: order.id, status: order.status });

    for (const pkg of order.packages ?? []) {
      await assignPickupCodes(pkg.id);
    }

    const refreshed = await this.getById(order.id);
    const tracking = refreshed.packages?.[0]?.trackingNumber ?? orderNumber;
    const pin = refreshed.packages?.[0]?.pickupPin;
    if (receiverUserId || order.receiverPhone) {
      await notifyReceiver({
        receiverUserId,
        receiverPhone: order.receiverPhone,
        type: 'INCOMING_PARCEL',
        title: 'Incoming parcel',
        body: `You have a parcel on the way (${tracking}).${pin ? ` Pickup code: ${pin}.` : ''} Track: ${trackUrl(tracking)}`,
      });
    }

    return refreshed;
  }

  async createBulk(rows: CreateOrderDto[], ctx: CreateOrderContext) {
    const results: Array<{
      index: number;
      success: boolean;
      orderNumber?: string;
      trackingNumber?: string;
      error?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const order = (await this.create(rows[i], ctx)) as {
          orderNumber: string;
          packages?: Array<{ trackingNumber: string }>;
        };
        results.push({
          index: i,
          success: true,
          orderNumber: order.orderNumber,
          trackingNumber: order.packages?.[0]?.trackingNumber,
        });
      } catch (e) {
        results.push({ index: i, success: false, error: e instanceof Error ? e.message : 'Failed to create order' });
      }
    }

    const created = results.filter((r) => r.success).length;
    return { total: rows.length, created, failed: rows.length - created, results };
  }

  async quote(dto: CreateOrderDto, deliveryType = dto.deliveryType ?? 'STANDARD'): Promise<PriceBreakdown> {
    const rule = await this.repo.activePricingRule(deliveryType);
    const baseFee = Number(rule?.baseFee ?? 50);
    const perKm = Number(rule?.perKmFee ?? 8);
    const perKg = Number(rule?.perKgFee ?? 5);
    const minFee = Number(rule?.minFee ?? 50);
    const surgeMultiplier = Number(rule?.surgeMultiplier ?? 1);
    const taxPercent = Number(rule?.taxPercent ?? 15);
    const currency = rule?.currency ?? 'ETB';

    let distanceKm = 0;
    const pickupCoords = await resolveAddressCoords(dto.pickup);
    const dropoffCoords = await resolveAddressCoords(dto.dropoff);
    if (pickupCoords && dropoffCoords) {
      const route = await osrmProvider.route(pickupCoords, dropoffCoords);
      distanceKm = route.distanceKm;
    }

    const distanceFee = round(perKm * distanceKm);
    const weightFee = round(perKg * (dto.package.weightKg || 0));
    const rawSubtotal = baseFee + distanceFee + weightFee;
    const surged = round(rawSubtotal * surgeMultiplier);
    const surge = round(surged - rawSubtotal);

    let discount = 0;
    if (dto.couponCode) discount = await this.computeCoupon(dto.couponCode, surged);

    const taxable = Math.max(0, surged - discount);
    const tax = round((taxable * taxPercent) / 100);
    const totalAmount = Math.max(minFee, round(taxable + tax));

    return { distanceKm, baseFee, distanceFee, weightFee, surge, discount, tax, totalAmount, currency };
  }

  private async computeCoupon(code: string, subtotal: number): Promise<number> {
    const coupon = await this.repo.couponByCode(code);
    if (!coupon || !coupon.isActive) return 0;
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return 0;
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) return 0;

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') discount = (subtotal * Number(coupon.value)) / 100;
    else if (coupon.type === 'FIXED') discount = Number(coupon.value);
    else discount = subtotal;

    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    return round(Math.min(discount, subtotal));
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getById(id);
    const wasDelivered = order.status === 'DELIVERED';
    const updated = await this.repo.updateStatus(id, dto.status, {
      ...(dto.status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      ...(dto.status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    });

    await this.repo.addTrackingEvent({
      orderId: id,
      type: mapStatusToEvent(dto.status),
      status: dto.status,
      description: dto.note,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    if (dto.status === 'DELIVERED' && !wasDelivered) {
      await this.creditDriverEarnings(id, order);
      await loyaltyService.awardDeliveryPoints(order.customerId);
    }

    eventBus.publish(DOMAIN_EVENTS.ORDER_STATUS_CHANGED, { orderId: id, status: dto.status });
    emitToOrder(id, SOCKET_EVENTS.ORDER_STATUS, { orderId: id, status: dto.status });
    emitToUser(order.customer.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
      type: 'ORDER_STATUS',
      title: 'Order update',
      body: `Your order ${order.orderNumber} is now ${dto.status}`,
    });

    if (order.merchantId) {
      void dispatchMerchantEvent(order.merchantId, 'parcel.status_changed', {
        orderId: id,
        orderNumber: order.orderNumber,
        status: dto.status,
        updatedAt: new Date().toISOString(),
      });
    }

    return updated;
  }

  async assignDriver(id: string, dto: AssignDriverDto) {
    await this.getById(id);
    await this.repo.assignDriver(id, dto.driverId, dto.vehicleId);
    const updated = await this.repo.updateStatus(id, 'ASSIGNED');
    await this.repo.addTrackingEvent({ orderId: id, type: 'DRIVER_ASSIGNED', status: 'Driver assigned' });
    eventBus.publish(DOMAIN_EVENTS.DRIVER_ASSIGNED, { orderId: id, driverId: dto.driverId });
    emitToOrder(id, SOCKET_EVENTS.ORDER_STATUS, { orderId: id, status: 'ASSIGNED' });
    return updated;
  }

  async cancel(id: string) {
    const order = await this.getById(id);
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot cancel an order that is ${order.status}`);
    }
    return this.updateStatus(id, { status: 'CANCELLED', note: 'Cancelled by request' });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function mapStatusToEvent(status: string) {
  const map: Record<string, 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED_AT_WAREHOUSE' | 'ARRIVED_AT_BRANCH' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'EXCEPTION' | 'DELIVERY_ATTEMPTED'> = {
    ASSIGNED: 'DRIVER_ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    AT_WAREHOUSE: 'ARRIVED_AT_WAREHOUSE',
    AT_BRANCH: 'ARRIVED_AT_BRANCH',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    FAILED: 'DELIVERY_ATTEMPTED',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
  };
  return map[status] ?? 'EXCEPTION';
}

export const ordersService = new OrdersService();
