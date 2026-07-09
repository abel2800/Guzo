import type { ApiResponse } from '@delivery/types';
import { apiGet, apiList, apiPost, apiPatch, getApi } from './api';
import type { CreateOrderInput, Order, PriceBreakdown } from './types';

export function quoteOrder(input: CreateOrderInput): Promise<PriceBreakdown> {
  return apiPost<PriceBreakdown>('/orders/quote', input);
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiPost<Order>('/orders', input);
}

export function listOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  scope?: 'available' | 'incoming';
} = {}) {
  return apiList<Order>('/orders', params);
}

export function getOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`);
}

export function trackOrder(reference: string): Promise<Order> {
  return apiGet<Order>(`/orders/track/${encodeURIComponent(reference)}`);
}

export function acceptOrder(orderId: string): Promise<Order> {
  return apiPost<Order>(`/orders/${orderId}/accept`, {});
}

export function updateOrderStatus(
  orderId: string,
  status: string,
  extra: { note?: string; latitude?: number; longitude?: number } = {},
): Promise<Order> {
  return apiPatch<Order>(`/orders/${orderId}/status`, { status, ...extra });
}

export function cancelOrder(orderId: string): Promise<Order> {
  return apiPost<Order>(`/orders/${orderId}/cancel`, {});
}

export interface PodUpload {
  uri: string;
  name: string;
  type: string;
}

export async function submitPod(
  orderId: string,
  input: {
    photo: PodUpload;
    signature?: PodUpload;
    recipientName?: string;
    note?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<Order> {
  const form = new FormData();
  form.append('photo', { uri: input.photo.uri, name: input.photo.name, type: input.photo.type } as unknown as Blob);
  if (input.signature) {
    form.append('signature', {
      uri: input.signature.uri,
      name: input.signature.name,
      type: input.signature.type,
    } as unknown as Blob);
  }
  if (input.recipientName) form.append('recipientName', input.recipientName);
  if (input.note) form.append('note', input.note);
  if (input.latitude != null) form.append('latitude', String(input.latitude));
  if (input.longitude != null) form.append('longitude', String(input.longitude));

  const { data } = await getApi().post<ApiResponse<Order>>(`/orders/${orderId}/pod`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export function postDriverLocation(body: {
  latitude: number;
  longitude: number;
  orderId?: string;
  speed?: number;
  heading?: number;
}): Promise<void> {
  return apiPost('/tracking/location', body).then(() => undefined);
}
