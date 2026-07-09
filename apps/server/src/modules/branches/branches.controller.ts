import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { branchesService } from './branches.service.js';
import { branchOpsService } from './branch-ops.service.js';
import { writeAudit } from '../../utils/audit.js';
import type { PodFile } from '../orders/orders.service.js';
import { ROLES } from '../../constants/index.js';

export const branchesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.roles.includes(ROLES.ADMIN as never) || req.user!.roles.includes(ROLES.SUPER_ADMIN as never);
    const all = isAdmin && req.query.all === 'true';
    const items = all
      ? await branchesService.listAll(true)
      : await branchesService.listActive(req.query.city as string | undefined);
    return ok(res, items, 'Branches loaded');
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const item = await branchesService.getById(req.params.id);
    return ok(res, item, 'Branch loaded');
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const data = await branchOpsService.stats(req.params.id, req.user!);
    return ok(res, data, 'Branch stats');
  }),

  inventory: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const state = (req.query.state as string) || 'in-stock';
    const { items, meta } = await branchOpsService.listInventory(req.params.id, page, limit, state, req.user!);
    return ok(res, items, 'Inventory loaded', meta);
  }),

  shelfLookup: asyncHandler(async (req: Request, res: Response) => {
    const items = await branchOpsService.lookupShelf(req.params.id, req.params.shelfCode, req.user!);
    return ok(res, items, 'Shelf lookup');
  }),

  receive: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body ?? {};
    if (!body.trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const data = await branchOpsService.receive(req.params.id, body, req.user!);
    return ok(res, data, 'Parcel received');
  }),

  receiveIntake: asyncHandler(async (req: Request, res: Response) => {
    const photo = req.file as PodFile | undefined;
    const body = {
      trackingNumber: req.body.trackingNumber as string,
      shelfCode: req.body.shelfCode as string | undefined,
      zone: req.body.zone as string | undefined,
      weightKg: req.body.weightKg as string | undefined,
      description: req.body.description as string | undefined,
    };
    if (!body.trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const data = await branchOpsService.receiveIntake(req.params.id, body, photo, req.user!);
    return ok(res, data, 'Parcel received');
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const data = await branchOpsService.registerParcel(req.params.id, req.body, req.user!);
    return ok(res, data, 'Parcel registered');
  }),

  label: asyncHandler(async (req: Request, res: Response) => {
    const data = await branchOpsService.getLabel(req.params.id, req.params.tracking, req.user!);
    return ok(res, data, 'Label loaded');
  }),

  assignShelf: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber, shelfCode, zone } = req.body ?? {};
    if (!trackingNumber || !shelfCode) throw ApiError.badRequest('trackingNumber and shelfCode are required');
    const data = await branchOpsService.assignShelf(req.params.id, { trackingNumber, shelfCode, zone }, req.user!);
    return ok(res, data, 'Shelf assigned');
  }),

  pickup: asyncHandler(async (req: Request, res: Response) => {
    const { reference, pin, collectCod } = req.body ?? {};
    const ref = typeof reference === 'string' ? reference.trim() : '';
    const pinVal = typeof pin === 'string' ? pin.trim() : '';
    if (!ref && !pinVal) throw ApiError.badRequest('reference or pin is required');
    const data = await branchOpsService.confirmPickup(req.params.id, { reference: ref, pin: pinVal || undefined, collectCod }, req.user!);
    return ok(res, data, 'Pickup confirmed');
  }),

  exception: asyncHandler(async (req: Request, res: Response) => {
    const { trackingNumber, reason } = req.body ?? {};
    if (!trackingNumber) throw ApiError.badRequest('trackingNumber is required');
    const data = await branchOpsService.markException(req.params.id, { trackingNumber, reason }, req.user!);
    return ok(res, data, 'Exception recorded');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body ?? {};
    if (!body.code || !body.name || !body.line1 || !body.city) {
      throw ApiError.badRequest('code, name, line1 and city are required');
    }
    const branch = await branchesService.create(body);
    await writeAudit({
      actorId: req.user!.id,
      action: 'branch.create',
      entityType: 'GuzoBranch',
      entityId: branch.id,
      after: branch,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return created(res, branch, 'Branch created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const before = await branchesService.getById(req.params.id);
    const branch = await branchesService.update(req.params.id, req.body ?? {});
    await writeAudit({
      actorId: req.user!.id,
      action: 'branch.update',
      entityType: 'GuzoBranch',
      entityId: branch.id,
      before,
      after: branch,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    return ok(res, branch, 'Branch updated');
  }),
};
