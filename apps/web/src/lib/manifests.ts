import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface ManifestSummary {
  id: string;
  manifestNumber: string;
  status: string;
  sealNumber?: string | null;
  originWarehouseId?: string | null;
  destinationWarehouseId?: string | null;
  driverId?: string | null;
  departedAt?: string | null;
  arrivedAt?: string | null;
  createdAt: string;
  parcelCount?: number;
  driverLocation?: { lat: number; lng: number; driverCode: string } | null;
}

export interface ManifestDetail extends ManifestSummary {
  parcels: Array<{
    id: string;
    packageId: string;
    trackingNumber: string;
    status: string;
    scannedAt: string;
    unloadedAt?: string | null;
  }>;
  unloadStatus: {
    expected: number;
    unloaded: number;
    missing: string[];
    complete: boolean;
  };
}

export interface LiveTruck {
  id: string;
  manifestNumber: string;
  sealNumber?: string | null;
  departedAt?: string | null;
  parcelCount: number;
  origin?: { id: string; name: string; city: string; latitude?: number | null; longitude?: number | null };
  destination?: { id: string; name: string; city: string; latitude?: number | null; longitude?: number | null };
  driver?: {
    id: string;
    driverCode: string;
    currentLat?: number | null;
    currentLng?: number | null;
    lastLocationAt?: string | null;
  } | null;
}

export function listManifests(warehouseId: string, scope: 'outbound' | 'inbound' | 'in-transit' = 'outbound') {
  return apiGet<ManifestSummary[]>(`/manifests?warehouseId=${warehouseId}&scope=${scope}`);
}

export function getLiveTrucks() {
  return apiGet<LiveTruck[]>('/dashboard/operations/trucks');
}

export async function getManifest(id: string): Promise<ManifestDetail> {
  return apiGet<ManifestDetail>(`/manifests/${id}`);
}

export async function createManifest(input: {
  originWarehouseId: string;
  destinationWarehouseId?: string;
  driverId?: string;
}): Promise<ManifestSummary> {
  const { data } = await api.post<ApiResponse<ManifestSummary>>('/manifests', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function scanManifestParcel(
  manifestId: string,
  input: { trackingNumber?: string; packageId?: string },
) {
  const { data } = await api.post<ApiResponse<unknown>>(`/manifests/${manifestId}/scan`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function departManifest(manifestId: string, sealNumber: string) {
  const { data } = await api.post<ApiResponse<ManifestSummary>>(`/manifests/${manifestId}/depart`, { sealNumber });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function arriveManifest(manifestId: string) {
  const { data } = await api.post<ApiResponse<ManifestSummary>>(`/manifests/${manifestId}/arrive`, {});
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function unloadManifestParcel(manifestId: string, trackingNumber: string) {
  const { data } = await api.post<ApiResponse<{ expected: number; unloaded: number; missing: string[]; complete: boolean }>>(
    `/manifests/${manifestId}/unload`,
    { trackingNumber },
  );
  if (!data.success) throw new Error(data.message);
  return data.data;
}
