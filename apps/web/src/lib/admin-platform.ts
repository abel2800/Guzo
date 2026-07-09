import { api } from './api';
import type { ApiResponse } from '@delivery/types';

function qs(params: Record<string, unknown>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) s.set(k, String(v));
  });
  return s.toString();
}

export interface Paginated<T> {
  items: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface MerchantRow {
  id: string;
  merchantCode: string;
  businessName: string;
  isActive?: boolean;
  createdAt?: string;
  user?: { email?: string; firstName?: string; lastName?: string };
}

export async function listMerchants(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<ApiResponse<MerchantRow[]>>(`/merchants?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export interface CustomerRow {
  id: string;
  customerCode?: string;
  createdAt?: string;
  user?: { email?: string; firstName?: string; lastName?: string; phone?: string };
}

export async function listCustomers(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<ApiResponse<CustomerRow[]>>(`/customers?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  city: string;
  capacity: number;
  isActive: boolean;
}

export async function listWarehouses(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<ApiResponse<WarehouseRow[]>>(`/warehouses?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function createWarehouse(body: Partial<WarehouseRow> & { line1: string }) {
  const { data } = await api.post<ApiResponse<WarehouseRow>>('/warehouses', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateWarehouse(id: string, body: Partial<WarehouseRow>) {
  const { data } = await api.patch<ApiResponse<WarehouseRow>>(`/warehouses/${id}`, body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface BranchRow {
  id: string;
  code: string;
  name: string;
  line1: string;
  city: string;
  phone?: string | null;
  isActive: boolean;
  queueLevel?: number;
  latitude?: number | null;
  longitude?: number | null;
}

export async function listBranches(all = true) {
  const { data } = await api.get<ApiResponse<BranchRow[]>>(`/branches?all=${all}`);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function createBranch(body: {
  code: string;
  name: string;
  line1: string;
  city: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}) {
  const { data } = await api.post<ApiResponse<BranchRow>>('/branches', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateBranch(id: string, body: Partial<BranchRow>) {
  const { data } = await api.patch<ApiResponse<BranchRow>>(`/branches/${id}`, body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface PricingRule {
  id: string;
  name: string;
  deliveryType: string;
  baseFee: string | number;
  perKmFee: string | number;
  perKgFee: string | number;
  minFee: string | number;
  surgeMultiplier: string | number;
  isActive: boolean;
}

export async function listPricingRules(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<ApiResponse<PricingRule[]>>(`/pricing?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function createPricingRule(body: Partial<PricingRule>) {
  const { data } = await api.post<ApiResponse<PricingRule>>('/pricing', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updatePricingRule(id: string, body: Partial<PricingRule>) {
  const { data } = await api.patch<ApiResponse<PricingRule>>(`/pricing/${id}`, body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deletePricingRule(id: string) {
  await api.delete(`/pricing/${id}`);
}

export interface CityZone {
  id: string;
  city: string;
  zoneName: string;
  multiplier: string | number;
  isActive: boolean;
}

export async function listCityZones(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<ApiResponse<CityZone[]>>(`/city-zones?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function createCityZone(body: { city: string; zoneName: string; multiplier?: number }) {
  const { data } = await api.post<ApiResponse<CityZone>>('/city-zones', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateCityZone(id: string, body: Partial<CityZone>) {
  const { data } = await api.patch<ApiResponse<CityZone>>(`/city-zones/${id}`, body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface CouponRow {
  id: string;
  code: string;
  type: string;
  value: string | number;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount?: number;
}

export async function listCoupons(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<ApiResponse<CouponRow[]>>(`/coupons?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function createCoupon(body: Partial<CouponRow>) {
  const { data } = await api.post<ApiResponse<CouponRow>>('/coupons', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface VehicleRow {
  id: string;
  plateNumber: string;
  type: string;
  status: string;
  brand?: string | null;
  model?: string | null;
  driverId?: string | null;
}

export async function listVehicles(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<ApiResponse<VehicleRow[]>>(`/vehicles?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function createVehicle(body: Partial<VehicleRow>) {
  const { data } = await api.post<ApiResponse<VehicleRow>>('/vehicles', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface PermissionRow {
  id: string;
  key: string;
  description?: string | null;
  resource: string;
  action: string;
}

export async function listPermissions(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<ApiResponse<PermissionRow[]>>(`/permissions?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actor?: { email?: string; firstName?: string; lastName?: string } | null;
}

export async function listAuditLogs(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<ApiResponse<AuditLogRow[]>>(`/admin/audit-logs?${qs(params)}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export interface ExceptionCenter {
  failedOrders: Array<{ id: string; orderNumber: string; status: string; trackingNumber?: string }>;
  lostPackages: Array<{ id: string; trackingNumber: string; status: string }>;
  exceptionPackages: Array<{ id: string; trackingNumber: string; status: string }>;
  failedDeliveries: Array<{ id: string; orderNumber?: string; failureReason?: string | null }>;
  urgentTickets: Array<{ id: string; ticketNumber: string; subject: string; priority: string }>;
  totals: Record<string, number>;
}

export async function getExceptionCenter(): Promise<ExceptionCenter> {
  const { data } = await api.get<ApiResponse<ExceptionCenter>>('/admin/exceptions');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface PaymentReconciliation {
  byStatus: Array<{ status: string; count: number; amount: number; refunded: number }>;
  anomalies: { pendingPaymentOrders: number; paidBeforeDelivery: number; deliveredUnpaid: number };
}

export async function getPaymentReconciliation(): Promise<PaymentReconciliation> {
  const { data } = await api.get<ApiResponse<PaymentReconciliation>>('/admin/payments/reconciliation');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}
