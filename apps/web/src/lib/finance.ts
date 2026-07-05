import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

type Money = number | string;

export interface OrderRef {
  id: string;
  orderNumber: string;
  merchantId?: string | null;
  customer?: { id: string; user?: { firstName: string; lastName: string; email?: string } | null } | null;
}

export interface Payment {
  id: string;
  reference: string;
  provider: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';
  amount: Money;
  currency: string;
  paidAt?: string | null;
  refundedAmount: Money;
  createdAt: string;
  order?: OrderRef | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';
  subtotal: Money;
  tax: Money;
  discount: Money;
  total: Money;
  currency: string;
  issuedAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
  order?: OrderRef | null;
}

export interface FinanceSummary {
  totals: {
    grossRevenue: number;
    refunded: number;
    netRevenue: number;
    paidCount: number;
    pendingCount: number;
    refundedCount: number;
    outstandingInvoices: number;
    outstandingAmount: number;
  };
  paymentsByStatus: Array<{ status: string; count: number }>;
}

export const num = (v: Money | undefined | null): number => (v == null ? 0 : Number(v));

export function getFinanceSummary(): Promise<FinanceSummary> {
  return apiGet<FinanceSummary>('/dashboard/finance');
}

function qs(params: Record<string, unknown>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) s.set(k, String(v));
  });
  return s.toString();
}

export async function listPayments(
  params: { page?: number; limit?: number; status?: string; search?: string } = {},
) {
  const { data } = await api.get<ApiResponse<Payment[]>>(`/payments?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function refundPayment(id: string, input: { amount?: number; reason?: string }): Promise<Payment> {
  const { data } = await api.post<ApiResponse<Payment>>(`/payments/${id}/refund`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function listInvoices(
  params: { page?: number; limit?: number; status?: string; search?: string } = {},
) {
  const { data } = await api.get<ApiResponse<Invoice[]>>(`/invoices?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
  const { data } = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}`, { status });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

type Variant = 'default' | 'secondary' | 'success' | 'destructive' | 'outline';

export const PAYMENT_STATUS_META: Record<string, { label: string; variant: Variant }> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  PROCESSING: { label: 'Processing', variant: 'secondary' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'destructive' },
  PARTIALLY_REFUNDED: { label: 'Partial refund', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

export const INVOICE_STATUS_META: Record<string, { label: string; variant: Variant }> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  ISSUED: { label: 'Issued', variant: 'default' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  VOID: { label: 'Void', variant: 'secondary' },
};

export function personName(order?: OrderRef | null): string {
  const u = order?.customer?.user;
  return u ? `${u.firstName} ${u.lastName}` : '—';
}
