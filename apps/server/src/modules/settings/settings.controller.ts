import type { Request, Response } from 'express';
import { settingsService } from './settings.service.js';
import { SETTINGS_MESSAGES } from './settings.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const settingsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await settingsService.list(parseListQuery(req));
    return ok(res, items, SETTINGS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await settingsService.getById(req.params.id);
    return ok(res, item, SETTINGS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await settingsService.create(req.body);
    return created(res, item, SETTINGS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await settingsService.update(req.params.id, req.body);
    return ok(res, item, SETTINGS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await settingsService.remove(req.params.id);
    return noContent(res);
  }),
};
