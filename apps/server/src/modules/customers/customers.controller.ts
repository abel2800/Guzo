import type { Request, Response } from 'express';
import { customersService } from './customers.service.js';
import { CUSTOMERS_MESSAGES } from './customers.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';
import { parseListQuery } from '../../utils/pagination.js';

export const customersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await customersService.list(parseListQuery(req));
    return ok(res, items, CUSTOMERS_MESSAGES.FETCHED, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await customersService.getById(req.params.id);
    return ok(res, item, CUSTOMERS_MESSAGES.FOUND);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await customersService.create(req.body);
    return created(res, item, CUSTOMERS_MESSAGES.CREATED);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await customersService.update(req.params.id, req.body);
    return ok(res, item, CUSTOMERS_MESSAGES.UPDATED);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await customersService.remove(req.params.id);
    return noContent(res);
  }),
};
