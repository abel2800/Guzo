import type { Request, Response } from 'express';
import { supportService } from './support.service.js';
import { SUPPORT_MESSAGES } from './support.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';
import { ROLES } from '../../constants/index.js';

function isAgent(req: Request) {
  return !!req.user?.roles.some(
    (r) => r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN || r === ROLES.SUPPORT,
  );
}

function ctxOf(req: Request) {
  return { userId: req.user!.id, isAgent: isAgent(req) };
}

export const supportController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    // Agents see the full queue; everyone else only their own tickets.
    const scope = isAgent(req) ? undefined : { requesterId: req.user!.id };
    const { items, meta } = await supportService.list(parseListQuery(req), scope);
    return ok(res, items, SUPPORT_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await supportService.getById(req.params.id, ctxOf(req));
    return ok(res, item, SUPPORT_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await supportService.create(req.body, req.user!.id);
    return created(res, item, SUPPORT_MESSAGES.CREATED);
  }),

  addMessage: asyncHandler(async (req: Request, res: Response) => {
    const message = await supportService.addMessage(req.params.id, req.body, ctxOf(req));
    return created(res, message, SUPPORT_MESSAGES.MESSAGE_ADDED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await supportService.update(req.params.id, req.body, ctxOf(req));
    return ok(res, item, SUPPORT_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await supportService.remove(req.params.id);
    return noContent(res);
  }),
};
