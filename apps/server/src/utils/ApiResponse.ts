import type { Response } from 'express';
import { HTTP_STATUS } from '../constants/index.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  unreadCount?: number;
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function ok<T>(res: Response, data: T, message = 'Success', meta?: PaginationMeta) {
  return res.status(HTTP_STATUS.OK).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export function created<T>(res: Response, data: T, message = 'Created') {
  return res.status(HTTP_STATUS.CREATED).json({ success: true, message, data });
}

export function noContent(res: Response) {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}
