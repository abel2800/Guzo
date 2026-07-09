import { apiDelete, apiGet, apiPost } from './api';
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

export interface MerchantCustomerRow {
  contactName: string | null;
  contactPhone: string | null;
  line1: string;
  city: string;
  orderCount: number;
  lastOrderAt: string;
}

export function listMerchantApiKeys(): Promise<MerchantApiKeyRow[]> {
  return apiGet<MerchantApiKeyRow[]>('/merchant-platform/keys');
}

export function createMerchantApiKey(label: string): Promise<CreatedApiKey> {
  return apiPost<CreatedApiKey>('/merchant-platform/keys', { label });
}

export function revokeMerchantApiKey(id: string): Promise<void> {
  return apiDelete(`/merchant-platform/keys/${id}`);
}

export function listMerchantCustomers(): Promise<MerchantCustomerRow[]> {
  return apiGet<MerchantCustomerRow[]>('/merchant-platform/customers');
}
