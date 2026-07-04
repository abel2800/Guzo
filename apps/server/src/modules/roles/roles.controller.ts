import type { Request, Response } from 'express';
import { rolesService } from './roles.service.js';
import { ROLES_MESSAGES } from './roles.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const rolesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await rolesService.list(parseListQuery(req));
    return ok(res, items, ROLES_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await rolesService.getById(req.params.id);
    return ok(res, item, ROLES_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await rolesService.create(req.body);
    return created(res, item, ROLES_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await rolesService.update(req.params.id, req.body);
    return ok(res, item, ROLES_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await rolesService.remove(req.params.id);
    return noContent(res);
  }),
};
