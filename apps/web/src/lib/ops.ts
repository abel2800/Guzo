import { api } from './api';
import type { ApiResponse } from '@delivery/types';
import type { Order, OrderStatus } from './orders';

export interface DriverRow {
  id: string;
  driverCode: string;
  approvalStatus: string;
  isAvailable?: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  scope?: 'available';
}

async function fetchOrders(params: OrderListParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const { data } = await api.get<ApiResponse<Order[]>>(`/orders?${qs.toString()}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export function listAllOrders(params: OrderListParams = {}) {
  return fetchOrders(params);
}

export function listAvailableJobs(params: Omit<OrderListParams, 'scope'> = {}) {
  return fetchOrders({ ...params, scope: 'available' });
}

export function listMyDeliveries(params: Omit<OrderListParams, 'scope'> = {}) {
  return fetchOrders(params);
}

export async function listDrivers(): Promise<DriverRow[]> {
  const { data } = await api.get<ApiResponse<DriverRow[]>>('/drivers?limit=100');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function assignDriver(orderId: string, driverId: string, vehicleId?: string): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/assign`, { driverId, vehicleId });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function acceptOrder(orderId: string): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/accept`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface ProofOfDeliveryInput {
  photo: Blob;
  signature?: Blob | null;
  recipientName?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
}

export async function submitProofOfDelivery(orderId: string, input: ProofOfDeliveryInput): Promise<Order> {
  const form = new FormData();
  form.append('photo', input.photo, 'pod-photo.jpg');
  if (input.signature) form.append('signature', input.signature, 'pod-signature.png');
  if (input.recipientName) form.append('recipientName', input.recipientName);
  if (input.note) form.append('note', input.note);
  if (input.latitude != null) form.append('latitude', String(input.latitude));
  if (input.longitude != null) form.append('longitude', String(input.longitude));

    const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/pod`, form, {
    headers: { 'Content-Type': undefined },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: { note?: string; latitude?: number; longitude?: number } = {},
): Promise<Order> {
  const { data } = await api.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, { status, ...extra });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function markDeliveryFailed(orderId: string, note?: string): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/failed`, { note });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function reattemptDelivery(orderId: string): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/reattempt`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function handoffAtBranch(
  orderId: string,
  input: { branchId: string; trackingNumber: string },
): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/branch-handoff`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface PickupProofInput {
  photo: Blob;
  signature?: Blob | null;
  note?: string;
  latitude?: number;
  longitude?: number;
}

export async function submitPickupProof(orderId: string, input: PickupProofInput): Promise<Order> {
  const form = new FormData();
  form.append('photo', input.photo, 'pickup-photo.jpg');
  if (input.signature) form.append('signature', input.signature, 'pickup-signature.png');
  if (input.note) form.append('note', input.note);
  if (input.latitude != null) form.append('latitude', String(input.latitude));
  if (input.longitude != null) form.append('longitude', String(input.longitude));
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/pickup-proof`, form, {
    headers: { 'Content-Type': undefined },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function scanPickup(
  orderId: string,
  input: { reference: string; latitude?: number; longitude?: number },
): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/scan-pickup`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function notifyDriverArrived(
  orderId: string,
  input: { latitude?: number; longitude?: number } = {},
): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>(`/orders/${orderId}/arrived`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface DriverEarnings {
  balance: number;
  totalDeliveries: number;
  transactions: Array<{
    id: string;
    amount: number;
    balanceAfter: number;
    currency: string;
    reference?: string | null;
    description?: string | null;
    createdAt: string;
  }>;
}

export async function getDriverEarnings(): Promise<DriverEarnings> {
  const { data } = await api.get<ApiResponse<DriverEarnings>>('/drivers/me/earnings');
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export const DRIVER_NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string; slide?: boolean }>> = {
  PICKED_UP: { next: 'IN_TRANSIT', label: 'Slide to start trip', slide: true },
  IN_TRANSIT: { next: 'OUT_FOR_DELIVERY', label: 'Slide — out for delivery', slide: true },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Mark delivered' },
  FAILED: { next: 'OUT_FOR_DELIVERY', label: 'Reattempt delivery' },
};

export const DRIVER_ALT_STATUS: Partial<Record<OrderStatus, Array<{ next: OrderStatus; label: string }>>> = {
  PICKED_UP: [
    { next: 'AT_BRANCH', label: 'Drop at branch' },
    { next: 'AT_WAREHOUSE', label: 'Deliver to warehouse' },
  ],
  IN_TRANSIT: [{ next: 'AT_WAREHOUSE', label: 'Arrive at warehouse' }],
  OUT_FOR_DELIVERY: [{ next: 'FAILED', label: 'Mark failed delivery' }],
};
export const ADMIN_STATUS_OPTIONS: OrderStatus[] = [
  'CONFIRMED',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'AT_WAREHOUSE',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
  'RETURNED',
];
