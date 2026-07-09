import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';
import type { CreateOrderInput, DeliveryType } from './orders';

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

export interface MerchantSummary {
  merchantCode: string;
  businessName: string;
  totals: {
    orders: number;
    delivered: number;
    inTransit: number;
    pendingPayment: number;
    revenue: number;
  };
  ordersByStatus: Array<{ status: string; count: number }>;
}

export async function createOrdersBulk(orders: CreateOrderInput[]): Promise<BulkSummary> {
  const { data } = await api.post<ApiResponse<BulkSummary>>('/orders/bulk', { orders });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export function getMerchantSummary(): Promise<MerchantSummary> {
  return apiGet<MerchantSummary>('/dashboard/merchant');
}


export interface MerchantApiKeyRow {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends MerchantApiKeyRow {
  apiKey: string;
}

export interface MerchantWebhookRow {
  id: string;
  url: string;
  events: string;
  isActive: boolean;
  createdAt: string;
  secret?: string;
}

export interface MerchantCustomerRow {
  contactName: string | null;
  contactPhone: string | null;
  line1: string;
  city: string;
  orderCount: number;
  lastOrderAt: string;
}

export async function listMerchantApiKeys(): Promise<MerchantApiKeyRow[]> {
  return apiGet<MerchantApiKeyRow[]>('/merchant-platform/keys');
}

export async function createMerchantApiKey(label: string): Promise<CreatedApiKey> {
  const { data } = await api.post<ApiResponse<CreatedApiKey>>('/merchant-platform/keys', { label });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function revokeMerchantApiKey(id: string): Promise<void> {
  await api.delete(`/merchant-platform/keys/${id}`);
}

export async function listMerchantWebhooks(): Promise<MerchantWebhookRow[]> {
  return apiGet<MerchantWebhookRow[]>('/merchant-platform/webhooks');
}

export async function registerMerchantWebhook(url: string, secret?: string): Promise<MerchantWebhookRow> {
  const { data } = await api.post<ApiResponse<MerchantWebhookRow>>('/merchant-platform/webhooks', { url, secret });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function setMerchantWebhookActive(id: string, isActive: boolean): Promise<MerchantWebhookRow> {
  const { data } = await api.patch<ApiResponse<MerchantWebhookRow>>(`/merchant-platform/webhooks/${id}`, { isActive });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function testMerchantWebhook(payload?: unknown): Promise<void> {
  await api.post('/merchant-platform/webhooks/test', { payload });
}

export async function listMerchantCustomers(): Promise<MerchantCustomerRow[]> {
  return apiGet<MerchantCustomerRow[]>('/merchant-platform/customers');
}


export const CSV_COLUMNS = [
  'deliveryType',
  'pickupContact',
  'pickupPhone',
  'pickupLine1',
  'pickupCity',
  'dropoffContact',
  'dropoffPhone',
  'dropoffLine1',
  'dropoffCity',
  'weightKg',
  'description',
] as const;

const VALID_DELIVERY_TYPES: DeliveryType[] = ['STANDARD', 'EXPRESS', 'SAME_DAY', 'SCHEDULED', 'INTERNATIONAL'];

export const CSV_TEMPLATE =
  CSV_COLUMNS.join(',') +
  '\n' +
  [
    'STANDARD,Morgan Goods,+251911000000,Bole Rd Warehouse,Addis Ababa,Alice Bekele,+251911111111,Bole 22 Apt 4,Addis Ababa,1.5,Pair of shoes',
    'EXPRESS,Morgan Goods,+251911000000,Bole Rd Warehouse,Addis Ababa,Samuel Tadesse,+251922222222,CMC Roundabout,Addis Ababa,3,Books x2',
  ].join('\n') +
  '\n';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export interface ParsedRow {
  raw: Record<string, string>;
  input?: CreateOrderInput;
  errors: string[];
}

export function parseOrdersCsv(text: string): ParsedRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  return dataRows.map((cells) => {
    const raw: Record<string, string> = {};
    header.forEach((h, i) => {
      raw[h] = (cells[i] ?? '').trim();
    });

    const errors: string[] = [];
    const weight = Number(raw.weightKg);
    if (!raw.pickupLine1) errors.push('pickupLine1 required');
    if (!raw.pickupCity) errors.push('pickupCity required');
    if (!raw.dropoffLine1) errors.push('dropoffLine1 required');
    if (!raw.dropoffCity) errors.push('dropoffCity required');
    if (!raw.weightKg || Number.isNaN(weight) || weight <= 0) errors.push('weightKg must be > 0');

    let deliveryType: DeliveryType = 'STANDARD';
    if (raw.deliveryType) {
      const dt = raw.deliveryType.toUpperCase() as DeliveryType;
      if (VALID_DELIVERY_TYPES.includes(dt)) deliveryType = dt;
      else errors.push(`invalid deliveryType "${raw.deliveryType}"`);
    }

    const input: CreateOrderInput | undefined =
      errors.length === 0
        ? {
            deliveryType,
            pickup: {
              line1: raw.pickupLine1,
              city: raw.pickupCity,
              contactName: raw.pickupContact || undefined,
              contactPhone: raw.pickupPhone || undefined,
            },
            dropoff: {
              line1: raw.dropoffLine1,
              city: raw.dropoffCity,
              contactName: raw.dropoffContact || undefined,
              contactPhone: raw.dropoffPhone || undefined,
            },
            package: { weightKg: weight, description: raw.description || undefined },
          }
        : undefined;

    return { raw, input, errors };
  });
}
