import { apiGet } from './api';

export interface GlobalSearchResult {
  orders: Array<{ id: string; orderNumber: string; status: string; totalAmount: unknown }>;
  users: Array<{ id: string; email: string; firstName: string; lastName: string }>;
  packages: Array<{ id: string; trackingNumber: string; status: string }>;
}

export function globalSearch(q: string): Promise<GlobalSearchResult> {
  return apiGet<GlobalSearchResult>(`/search?q=${encodeURIComponent(q)}`);
}
