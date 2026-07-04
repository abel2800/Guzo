import type { Request, Response } from 'express';
import { permissionsService } from './permissions.service.js';
import { PERMISSIONS_MESSAGES } from './permissions.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const permissionsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await permissionsService.list(parseListQuery(req));
    return ok(res, items, PERMISSIONS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await permissionsService.getById(req.params.id);
    return ok(res, item, PERMISSIONS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await permissionsService.create(req.body);
    return created(res, item, PERMISSIONS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await permissionsService.update(req.params.id, req.body);
    return ok(res, item, PERMISSIONS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await permissionsService.remove(req.params.id);
    return noContent(res);
  }),
};
