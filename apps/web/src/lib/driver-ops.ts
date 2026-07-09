import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface DriverManifestSummary {
  id: string;
  manifestNumber: string;
  status: string;
  sealNumber?: string | null;
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

export function listDriverManifests() {
  return apiGet<DriverManifestSummary[]>('/drivers/me/manifests');
}

export function getDriverManifest(id: string) {
  return apiGet<DriverManifestDetail>(`/drivers/me/manifests/${id}`);
}

export async function scanDriverManifest(manifestId: string, trackingNumber: string) {
  const { data } = await api.post<ApiResponse<unknown>>(`/drivers/me/manifests/${manifestId}/scan`, { trackingNumber });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function departDriverManifest(manifestId: string) {
  const { data } = await api.post<ApiResponse<unknown>>(`/drivers/me/manifests/${manifestId}/depart`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function arriveDriverManifest(manifestId: string) {
  const { data } = await api.post<ApiResponse<unknown>>(`/drivers/me/manifests/${manifestId}/arrive`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function unloadDriverManifest(manifestId: string, trackingNumber: string) {
  const { data } = await api.post<ApiResponse<unknown>>(`/drivers/me/manifests/${manifestId}/unload`, { trackingNumber });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export interface DriverVehicle {
  id: string;
  plateNumber: string;
  type: string;
  status: string;
  brand?: string | null;
  model?: string | null;
}

export interface VehicleLogEntry {
  id: string;
  type: string;
  odometerKm?: number | null;
  amount?: number | null;
  note?: string | null;
  loggedAt: string;
}

export function getDriverVehicle() {
  return apiGet<DriverVehicle | null>('/drivers/me/vehicle');
}

export function listVehicleLogs() {
  return apiGet<VehicleLogEntry[]>('/drivers/me/vehicle/logs');
}

export async function createVehicleLog(input: {
  type: 'FUEL' | 'MAINTENANCE' | 'MILEAGE' | 'INSPECTION';
  odometerKm?: number;
  amount?: number;
  note?: string;
}) {
  const { data } = await api.post<ApiResponse<VehicleLogEntry>>('/drivers/me/vehicle/logs', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
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

export function getDriverRoute() {
  return apiGet<OptimizedRoute>('/drivers/me/route');
}
