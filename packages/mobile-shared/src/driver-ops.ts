import type { ApiResponse } from '@delivery/types';
import { apiGet, apiPost, getApi } from './api';
import type { PodUpload } from './orders';
import type { Order } from './types';

export interface DriverManifestSummary {
  id: string;
  manifestNumber: string;
  status: string;
  sealNumber?: string | null;
  originWarehouseId?: string | null;
  destinationWarehouseId?: string | null;
  parcelCount: number;
  departedAt?: string | null;
  arrivedAt?: string | null;
}

export interface DriverManifestDetail extends DriverManifestSummary {
  parcels: Array<{
    id: string;
    packageId: string;
    trackingNumber: string;
    status: string;
    scannedAt?: string | null;
    unloadedAt?: string | null;
  }>;
  unloadStatus?: { expected: number; unloaded: number; complete: boolean };
}

export function listDriverManifests(): Promise<DriverManifestSummary[]> {
  return apiGet<DriverManifestSummary[]>('/drivers/me/manifests');
}

export function getDriverManifest(id: string): Promise<DriverManifestDetail> {
  return apiGet<DriverManifestDetail>(`/drivers/me/manifests/${id}`);
}

export function scanDriverManifest(manifestId: string, trackingNumber: string) {
  return apiPost(`/drivers/me/manifests/${manifestId}/scan`, { trackingNumber });
}

export function departDriverManifest(manifestId: string) {
  return apiPost(`/drivers/me/manifests/${manifestId}/depart`, {});
}

export function arriveDriverManifest(manifestId: string) {
  return apiPost(`/drivers/me/manifests/${manifestId}/arrive`, {});
}

export function unloadDriverManifest(manifestId: string, trackingNumber: string) {
  return apiPost(`/drivers/me/manifests/${manifestId}/unload`, { trackingNumber });
}

export async function submitPickupProof(
  orderId: string,
  input: {
    photo: PodUpload;
    signature?: PodUpload;
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
  if (input.note) form.append('note', input.note);
  if (input.latitude != null) form.append('latitude', String(input.latitude));
  if (input.longitude != null) form.append('longitude', String(input.longitude));

  const { data } = await getApi().post<ApiResponse<Order>>(`/orders/${orderId}/pickup-proof`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export function handoffAtBranch(
  orderId: string,
  input: { branchId: string; trackingNumber: string },
): Promise<Order> {
  return apiPost<Order>(`/orders/${orderId}/branch-handoff`, input);
}

export function markDeliveryFailed(orderId: string, note?: string): Promise<Order> {
  return apiPost<Order>(`/orders/${orderId}/failed`, { note });
}

export function reattemptDelivery(orderId: string): Promise<Order> {
  return apiPost<Order>(`/orders/${orderId}/reattempt`, {});
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

export function getDriverEarnings(): Promise<DriverEarnings> {
  return apiGet<DriverEarnings>('/drivers/me/earnings');
}

export interface DriverVehicle {
  id: string;
  plateNumber: string;
  type: string;
  status: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
}

export interface VehicleLogEntry {
  id: string;
  type: string;
  odometerKm?: number | null;
  amount?: number | null;
  note?: string | null;
  loggedAt: string;
}

export function getDriverVehicle(): Promise<DriverVehicle | null> {
  return apiGet<DriverVehicle | null>('/drivers/me/vehicle');
}

export function listVehicleLogs(): Promise<VehicleLogEntry[]> {
  return apiGet<VehicleLogEntry[]>('/drivers/me/vehicle/logs');
}

export function createVehicleLog(input: {
  type: 'FUEL' | 'MAINTENANCE' | 'MILEAGE' | 'INSPECTION';
  odometerKm?: number;
  amount?: number;
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<VehicleLogEntry> {
  return apiPost<VehicleLogEntry>('/drivers/me/vehicle/logs', input);
}

export interface RouteStop {
  orderId: string;
  orderNumber: string;
  type: 'pickup' | 'dropoff';
  line1: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalStops: number;
  estimatedKm?: number;
}

export function getDriverRoute(): Promise<OptimizedRoute> {
  return apiGet<OptimizedRoute>('/drivers/me/route');
}
