import { api } from './api';
import type { ApiResponse } from '@delivery/types';
import type { Order, OrderStatus } from './orders';

/** A driver row as returned by GET /drivers (admin/ops only). */
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

/** Admin/ops: every order in the system. */
export function listAllOrders(params: OrderListParams = {}) {
  return fetchOrders(params);
}

/** Driver: unclaimed confirmed jobs available to accept. */
export function listAvailableJobs(params: Omit<OrderListParams, 'scope'> = {}) {
  return fetchOrders({ ...params, scope: 'available' });
}

/** Driver: orders assigned to the authenticated driver. */
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

/** Upload proof-of-delivery (multipart) and complete the order. */
export async function submitProofOfDelivery(orderId: string, input: ProofOfDeliveryInput): Promise<Order> {
  const form = new FormData();
  form.append('photo', input.photo, 'pod-photo.jpg');
  if (input.signature) form.append('signature', input.signature, 'pod-signature.png');
  if (input.recipientName) form.append('recipientName', input.recipientName);
  if (input.note) form.append('note', input.note);
  if (input.latitude != null) form.append('latitude', String(input.latitude));
  if (input.longitude != null) form.append('longitude', String(input.longitude));

  // Pass Content-Type undefined so the browser sets the multipart boundary.
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

/**
 * The forward-only status path a driver walks an order through, and the next
 * action label for each. Terminal/branch states are omitted.
 */
export const DRIVER_NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  ASSIGNED: { next: 'PICKED_UP', label: 'Mark picked up' },
  PICKED_UP: { next: 'IN_TRANSIT', label: 'Start transit' },
  IN_TRANSIT: { next: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Mark delivered' },
};

/** Statuses an admin/ops user can set manually from the order drawer. */
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
