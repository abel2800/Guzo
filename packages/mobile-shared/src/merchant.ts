import { apiPost } from './api';
import type { CreateOrderInput } from './types';

export interface BulkResultRow {
  index: number;
  success: boolean;
  orderNumber?: string;
  trackingNumber?: string;
  error?: string;
}

export interface BulkSummary {
  total: number;
  created: number;
  failed: number;
  results: BulkResultRow[];
}

export function createOrdersBulk(orders: CreateOrderInput[]): Promise<BulkSummary> {
  return apiPost<BulkSummary>('/orders/bulk', { orders });
}
