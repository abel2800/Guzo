import type { Request } from 'express';
import { PAGINATION } from '../constants/index.js';

export interface ParsedListQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
}

const RESERVED = new Set(['page', 'limit', 'search', 'sortBy', 'sortOrder']);

/**
 * Parses standard pagination/sorting/search/filter query params.
 * Everything that's not reserved is treated as an equality filter.
 */
export function parseListQuery(req: Request): ParsedListQuery {
  const q = req.query;
  const page = Math.max(1, Number(q.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(q.limit) || PAGINATION.DEFAULT_LIMIT));
  const sortOrder = q.sortOrder === 'asc' ? 'asc' : 'desc';

  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(q)) {
    if (!RESERVED.has(key) && typeof value === 'string' && value.length > 0) {
      filters[key] = value;
    }
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    search: typeof q.search === 'string' ? q.search : undefined,
    sortBy: typeof q.sortBy === 'string' ? q.sortBy : undefined,
    sortOrder,
    filters,
  };
}
