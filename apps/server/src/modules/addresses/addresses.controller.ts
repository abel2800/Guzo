import type { Request, Response } from 'express';
import { addressService } from './addresses.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/ApiResponse.js';

export const addressesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await addressService.list(req.user!.id);
    return ok(res, items, 'Addresses fetched');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await addressService.create(req.user!.id, req.body);
    return created(res, item, 'Address created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await addressService.update(req.params.id, req.user!.id, req.body);
    return ok(res, item, 'Address updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await addressService.remove(req.params.id, req.user!.id);
    return noContent(res);
  }),
};
