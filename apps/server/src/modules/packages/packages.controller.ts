import type { Request, Response } from 'express';
import { packagesService } from './packages.service.js';
import { PACKAGES_MESSAGES } from './packages.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const packagesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await packagesService.list(parseListQuery(req));
    return ok(res, items, PACKAGES_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await packagesService.getById(req.params.id);
    return ok(res, item, PACKAGES_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await packagesService.create(req.body);
    return created(res, item, PACKAGES_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await packagesService.update(req.params.id, req.body);
    return ok(res, item, PACKAGES_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await packagesService.remove(req.params.id);
    return noContent(res);
  }),
};
