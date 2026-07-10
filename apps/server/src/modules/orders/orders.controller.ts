import type { Request, Response } from 'express';
import { ordersService } from './orders.service.js';
import { ORDER_MESSAGES } from './orders.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { ROLES } from '../../constants/index.js';
import { serializeOrder, serializeOrders } from './orders.serializer.js';

function isAdmin(req: Request) {
  return !!req.user?.roles.some(
    (r) =>
      r === ROLES.ADMIN ||
      r === ROLES.SUPER_ADMIN ||
      r === ROLES.SUPPORT ||
      r === ROLES.OPERATIONS_MANAGER,
  );
}

function isDriver(req: Request) {
  return !!req.user?.roles.some((r) => r === ROLES.DRIVER);
}

function isMerchant(req: Request) {
  return !!req.user?.roles.some((r) => r === ROLES.MERCHANT);
}

export const ordersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
                    let scope: Parameters<typeof ordersService.list>[1];
    if (isAdmin(req)) {
      scope = undefined;
    } else if (isDriver(req)) {
      scope =
        req.query.scope === 'available'
          ? { unassigned: true }
          : { driverUserId: req.user!.id };
    } else if (isMerchant(req)) {
      scope = { merchantUserId: req.user!.id };
    } else {
      const scopeParam = typeof req.query.scope === 'string' ? req.query.scope : undefined;
      const customerOrderScope =
        scopeParam === 'incoming' ? 'incoming' : scopeParam === 'all' ? 'all' : 'sent';
      scope = {
        customerUserId: req.user!.id,
        customerOrderScope,
      };
    }
    const { items, meta } = await ordersService.list(parseListQuery(req), scope);
    return ok(res, serializeOrders(items as never[]), ORDER_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.getById(req.params.id);
    return ok(res, serializeOrder(order as never), ORDER_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.create(req.body, {
      userId: req.user!.id,
      isAdmin: isAdmin(req),
      isMerchant: isMerchant(req),
    });
    return created(res, order, ORDER_MESSAGES.CREATED);
  }),

  createBulk: asyncHandler(async (req: Request, res: Response) => {
    const rows = Array.isArray(req.body?.orders) ? req.body.orders : [];
    if (rows.length === 0) throw ApiError.badRequest('Provide a non-empty "orders" array');
    if (rows.length > 200) throw ApiError.badRequest('Bulk upload is limited to 200 orders per request');
    const summary = await ordersService.createBulk(rows, {
      userId: req.user!.id,
      isAdmin: isAdmin(req),
      isMerchant: isMerchant(req),
    });
    return created(res, summary, `Processed ${summary.total} orders`);
  }),

  quote: asyncHandler(async (req: Request, res: Response) => {
    const breakdown = await ordersService.quote(req.body);
    return ok(res, breakdown, 'Price quote');
  }),

  track: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.track(req.params.reference);
    return ok(res, serializeOrder(order as never), 'Tracking details');
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.updateStatus(req.params.id, req.body);
    return ok(res, order, ORDER_MESSAGES.STATUS_UPDATED);
  }),

  assignDriver: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.assignDriver(req.params.id, req.body);
    return ok(res, order, ORDER_MESSAGES.ASSIGNED);
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.accept(req.params.id, req.user!.id);
    return ok(res, order, ORDER_MESSAGES.ASSIGNED);
  }),

  submitProof: asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const photo = files?.photo?.[0];
    if (!photo) throw ApiError.badRequest('A delivery photo is required');
    const signature = files?.signature?.[0];

    const toNum = (v: unknown) => (v !== undefined && v !== '' ? Number(v) : undefined);
    const order = await ordersService.completeWithProof(req.params.id, req.user!.id, {
      photo,
      signature,
      recipientName: typeof req.body.recipientName === 'string' ? req.body.recipientName : undefined,
      note: typeof req.body.note === 'string' ? req.body.note : undefined,
      latitude: toNum(req.body.latitude),
      longitude: toNum(req.body.longitude),
    });
    return ok(res, order, ORDER_MESSAGES.STATUS_UPDATED);
  }),

  submitPickupProof: asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const photo = files?.photo?.[0];
    if (!photo) throw ApiError.badRequest('A pickup photo is required');
    const signature = files?.signature?.[0];
    const toNum = (v: unknown) => (v !== undefined && v !== '' ? Number(v) : undefined);
    const order = await ordersService.confirmPickupWithProof(req.params.id, req.user!.id, {
      photo,
      signature,
      note: typeof req.body.note === 'string' ? req.body.note : undefined,
      latitude: toNum(req.body.latitude),
      longitude: toNum(req.body.longitude),
    });
    return ok(res, order, 'Pickup confirmed');
  }),

  branchHandoff: asyncHandler(async (req: Request, res: Response) => {
    const { branchId, trackingNumber } = req.body ?? {};
    if (!branchId || !trackingNumber) throw ApiError.badRequest('branchId and trackingNumber are required');
    const order = await ordersService.branchHandoff(req.params.id, req.user!.id, { branchId, trackingNumber });
    return ok(res, order, 'Dropped at branch');
  }),

  scanPickup: asyncHandler(async (req: Request, res: Response) => {
    const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim() : '';
    if (!reference) throw ApiError.badRequest('reference is required (tracking number or QR code)');
    const toNum = (v: unknown) => (v !== undefined && v !== '' ? Number(v) : undefined);
    const order = await ordersService.scanPickup(req.params.id, req.user!.id, {
      reference,
      latitude: toNum(req.body.latitude),
      longitude: toNum(req.body.longitude),
    });
    return ok(res, serializeOrder(order as never), 'Pickup confirmed');
  }),

  notifyArrived: asyncHandler(async (req: Request, res: Response) => {
    const toNum = (v: unknown) => (v !== undefined && v !== '' ? Number(v) : undefined);
    const order = await ordersService.notifyDriverArrived(req.params.id, req.user!.id, {
      latitude: toNum(req.body.latitude),
      longitude: toNum(req.body.longitude),
    });
    return ok(res, serializeOrder(order as never), 'Receiver notified');
  }),

  markFailed: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.markFailed(
      req.params.id,
      req.user!.id,
      typeof req.body?.note === 'string' ? req.body.note : undefined,
    );
    return ok(res, order, 'Delivery marked failed');
  }),

  reattempt: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.reattemptDelivery(req.params.id, req.user!.id);
    return ok(res, order, 'Delivery reattempt started');
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.cancel(req.params.id);
    return ok(res, order, ORDER_MESSAGES.CANCELLED);
  }),
};
