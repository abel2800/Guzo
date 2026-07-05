import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  city: string;
  capacity: number;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  shelfCode?: string | null;
  zone?: string | null;
  receivedAt: string;
  dispatchedAt?: string | null;
  warehouse?: { id: string; code: string; name: string };
  package: {
    id: string;
    trackingNumber: string;
    status: string;
    description?: string | null;
    weightKg: number;
    order: {
      id: string;
      orderNumber: string;
      status: string;
      dropoffAddress?: { city: string; line1: string; contactName?: string | null } | null;
    };
  };
}

export interface WarehouseStats {
  totals: { inStock: number; receivedToday: number; dispatchedToday: number };
  packagesByStatus: Array<{ status: string; count: number }>;
}

export interface WarehouseSummary {
  totals: { warehouses: number; inStock: number; receivedToday: number; dispatchedToday: number };
  packagesByStatus: Array<{ status: string; count: number }>;
}

export function listWarehouses(): Promise<WarehouseRow[]> {
  return apiGet<WarehouseRow[]>('/warehouses?limit=100');
}

export function getWarehouseSummary(): Promise<WarehouseSummary> {
  return apiGet<WarehouseSummary>('/dashboard/warehouse');
}

export async function getWarehouseStats(warehouseId: string): Promise<WarehouseStats> {
  return apiGet<WarehouseStats>(`/warehouses/${warehouseId}/stats`);
}

export async function listInventory(
  warehouseId: string,
  params: { state?: 'in-stock' | 'dispatched' | 'all'; search?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const { data } = await api.get<ApiResponse<InventoryItem[]>>(`/warehouses/${warehouseId}/inventory?${qs.toString()}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function receiveParcel(
  warehouseId: string,
  input: { trackingNumber: string; shelfCode?: string; zone?: string; note?: string },
): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>(`/warehouses/${warehouseId}/receive`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function sortParcel(
  warehouseId: string,
  input: { trackingNumber: string; shelfCode: string; zone?: string },
): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>(`/warehouses/${warehouseId}/sort`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function dispatchParcel(
  warehouseId: string,
  input: { trackingNumber: string; note?: string },
): Promise<InventoryItem> {
  const { data } = await api.post<ApiResponse<InventoryItem>>(`/warehouses/${warehouseId}/dispatch`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export const PACKAGE_STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  CREATED: { label: 'Created', variant: 'outline' },
  AT_ORIGIN: { label: 'At origin', variant: 'secondary' },
  IN_WAREHOUSE: { label: 'In warehouse', variant: 'default' },
  SORTED: { label: 'Sorted', variant: 'default' },
  DISPATCHED: { label: 'Dispatched', variant: 'secondary' },
  IN_TRANSIT: { label: 'In transit', variant: 'secondary' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', variant: 'secondary' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  LOST: { label: 'Lost', variant: 'destructive' },
  DAMAGED: { label: 'Damaged', variant: 'destructive' },
  RETURNED: { label: 'Returned', variant: 'destructive' },
};
