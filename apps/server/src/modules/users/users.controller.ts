import type { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { USER_MESSAGES } from './users.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const usersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await usersService.list(parseListQuery(req));
    return ok(res, items, USER_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getById(req.params.id);
    return ok(res, user, USER_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.create(req.body);
    return created(res, user, USER_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.update(req.params.id, req.body);
    return ok(res, user, USER_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await usersService.remove(req.params.id);
    return noContent(res);
  }),

  assignRoles: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.assignRoles(req.params.id, req.body.roles);
    return ok(res, user, USER_MESSAGES.ROLES_UPDATED);
  }),
};
