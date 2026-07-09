import { apiList } from './api';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  orderId?: string | null;
  createdAt: string;
}

export function listInvoices(params: { page?: number; limit?: number } = {}) {
  return apiList<Invoice>('/invoices', params);
}
