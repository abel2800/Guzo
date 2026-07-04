import type { Request, Response } from 'express';
import { searchService } from './search.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

export const searchController = {
  global: asyncHandler(async (req: Request, res: Response) => {
    const data = await searchService.search(String(req.query.q ?? ''));
    return ok(res, data, 'Search results');
  }),
};
