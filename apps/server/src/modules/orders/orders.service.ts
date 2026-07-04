import { ordersRepository, OrdersRepository } from './orders.repository.js';
import type { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto } from './orders.dto.js';
import type { PriceBreakdown } from './orders.types.js';
import { ORDER_MESSAGES, ORDER_SORTABLE_FIELDS } from './orders.constants.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, type PaginationMeta } from '../../utils/ApiResponse.js';
import type { ParsedListQuery } from '../../utils/pagination.js';
import { generateReference, generateTrackingNumber } from '@delivery/utils';
import { osrmProvider } from '../../providers/maps/osrm.provider.js';
import { paymentProvider } from '../../providers/payment/index.js';
import { storage } from '../../providers/storage/index.js';
import { UPLOAD_FOLDERS } from '../../constants/index.js';
import { eventBus, DOMAIN_EVENTS } from '../../events/eventBus.js';
import { emitToOrder, emitToAdmins, emitToUser } from '../../socket/index.js';
import { SOCKET_EVENTS } from '@delivery/types';

export interface CreateOrderContext {
  userId: string;
  isAdmin: boolean;
  isMerchant?: boolean;
}

/** Subset of a Multer disk file used by the proof-of-delivery flow. */
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
      driverUserId?: string;
      merchantUserId?: string;
      unassigned?: boolean;
    },
  ): Promise<{ items: unknown[]; meta: PaginationMeta }> {
    const sortBy = ORDER_SORTABLE_FIELDS.includes(query.sortBy as never) ? query.sortBy : 'createdAt';

    // Resolve the owning customer when scoping a non-admin request to their own orders.
    // Merchants are scoped by merchantId instead, so skip customer resolution for them.
    let customerId = scope?.customerId ?? query.filters.customerId;
    if (!customerId && scope?.customerUserId && !scope.merchantUserId) {
      const customer = await this.repo.customerByUserId(scope.customerUserId);
      // Sentinel guarantees an empty result if the user has no customer profile,
      // rather than leaking every order in the system.
      customerId = customer?.id ?? '__no_customer__';
    }

    // Scope to the authenticated driver's assigned deliveries.
    let driverId: string | undefined;
    if (scope?.driverUserId && !scope.unassigned) {
      const driver = await this.repo.driverByUserId(scope.driverUserId);
      driverId = driver?.id ?? '__no_driver__';
    }

    // Scope to the authenticated merchant's own shipments.
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
      merchantId,
      driverId,
      unassigned: scope?.unassigned,
      sortBy,
      sortOrder: query.sortOrder,
    });
    return { items, meta: buildMeta(query.page, query.limit, total) };
  }

  /**
   * Finalize a delivery with proof: persist the captured photo (+ optional
   * signature) as File rows, attach them to the delivery, record the recipient,
   * then transition the order to DELIVERED (reusing the standard status flow so
   * tracking/socket/notifications stay consistent).
   */
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

    return this.updateStatus(orderId, {
      status: 'DELIVERED',
      note: input.note ?? (input.recipientName ? `Delivered to ${input.recipientName}` : 'Delivered'),
      latitude: input.latitude,
      longitude: input.longitude,
    });
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

  /** A driver claims an available (confirmed, unassigned) order. */
  async accept(orderId: string, userId: string) {
    const driver = await this.repo.driverByUserId(userId);
    if (!driver) throw ApiError.badRequest('Authenticated user is not a driver');

    const order = await this.getById(orderId);
    if (order.delivery) throw ApiError.badRequest('This order has already been assigned');
    if (order.status !== 'CONFIRMED') {
      throw ApiError.badRequest(`Only confirmed orders can be accepted (order is ${order.status})`);
    }

    return this.assignDriver(orderId, { driverId: driver.id });
  }

  async getById(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  /** Public tracking lookup by tracking number or order number. */
  async track(reference: string) {
    const byOrder = await this.repo.findByNumber(reference);
    if (byOrder) return byOrder;
    const pkg = await this.repo.client.package.findUnique({ where: { trackingNumber: reference } });
    if (!pkg) throw ApiError.notFound('No shipment found for that reference');
    return this.getById(pkg.orderId);
  }

  async create(dto: CreateOrderDto, ctx: CreateOrderContext) {
    // Merchants ship on behalf of recipients: tag the order with the merchant
    // and derive/attach a "house" customer profile so schema invariants hold.
    let merchantId = dto.merchantId;
    if (ctx.isMerchant && !ctx.isAdmin) {
      const merchant = await this.repo.merchantByUserId(ctx.userId);
      if (!merchant) throw ApiError.badRequest('Authenticated user is not a merchant');
      merchantId = merchant.id;
    }

    // Resolve the owning customer.
    let customerId = dto.customerId;
    if (!customerId || !ctx.isAdmin) {
      let customer = await this.repo.customerByUserId(ctx.userId);
      if (!customer && ctx.isMerchant) customer = await this.repo.ensureCustomerForUser(ctx.userId);
      if (!customer) throw ApiError.badRequest('Authenticated user is not a customer');
      customerId = customer.id;
    }

    const deliveryType = dto.deliveryType ?? 'STANDARD';
    const price = await this.quote(dto, deliveryType);

    const orderNumber = generateReference('ORD');
    const trackingNumber = generateTrackingNumber();
    const invoiceNumber = generateReference('INV');
    const paymentReference = generateReference('PAY');

    // Charge via the (fake) payment provider before persisting the paid state.
    const charge = await paymentProvider.charge({
      amount: price.totalAmount,
      currency: price.currency,
      reference: paymentReference,
      description: `Payment for order ${orderNumber}`,
    });
    const paid = charge.status === 'PAID';

    const order = await this.repo.create({
      orderNumber,
      customer: { connect: { id: customerId } },
      ...(merchantId ? { merchant: { connect: { id: merchantId } } } : {}),
      deliveryType,
      status: paid ? 'CONFIRMED' : 'PENDING_PAYMENT',
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
          latitude: dto.pickup.latitude,
          longitude: dto.pickup.longitude,
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
          latitude: dto.dropoff.latitude,
          longitude: dto.dropoff.longitude,
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
          provider: charge.provider,
          providerRef: charge.providerRef,
          method: 'FAKE',
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

    return order;
  }

  /**
   * Create many orders in one request (merchant bulk shipment). Each row is
   * processed independently so a single bad row doesn't abort the batch; the
   * caller receives a per-row success/error breakdown.
   */
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

  /** Price preview without persisting - used by the "get a quote" endpoint. */
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
    if (dto.pickup.latitude && dto.pickup.longitude && dto.dropoff.latitude && dto.dropoff.longitude) {
      const route = await osrmProvider.route(
        { lat: dto.pickup.latitude, lng: dto.pickup.longitude },
        { lat: dto.dropoff.latitude, lng: dto.dropoff.longitude },
      );
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
    else discount = subtotal; // FREE_SHIPPING (simplified)

    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    return round(Math.min(discount, subtotal));
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getById(id);
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

    eventBus.publish(DOMAIN_EVENTS.ORDER_STATUS_CHANGED, { orderId: id, status: dto.status });
    emitToOrder(id, SOCKET_EVENTS.ORDER_STATUS, { orderId: id, status: dto.status });
    emitToUser(order.customer.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
      type: 'ORDER_STATUS',
      title: 'Order update',
      body: `Your order ${order.orderNumber} is now ${dto.status}`,
    });
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
  const map: Record<string, 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED_AT_WAREHOUSE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'EXCEPTION'> = {
    ASSIGNED: 'DRIVER_ASSIGNED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    AT_WAREHOUSE: 'ARRIVED_AT_WAREHOUSE',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
  };
  return map[status] ?? 'EXCEPTION';
}

export const ordersService = new OrdersService();
