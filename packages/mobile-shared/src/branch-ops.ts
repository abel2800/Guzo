import { apiGet, apiList, apiPost, getApi } from './api';
import type { ApiResponse } from '@delivery/types';

export interface BranchStaffAssignment {
  branchId: string;
  assignedAt: string;
  branch?: {
    id: string;
    code: string;
    name: string;
    city: string;
    line1: string;
    phone?: string | null;
  } | null;
}

export interface BranchInventoryItem {
  id: string;
  shelfCode?: string | null;
  zone?: string | null;
  receivedAt?: string;
  pickedUpAt?: string | null;
  measuredWeightKg?: number | null;
  photoUrl?: string | null;
  branch?: { id: string; code: string; name: string } | null;
  package?: {
    id: string;
    trackingNumber: string;
    status: string;
    pickupPin?: string | null;
    description?: string | null;
    weightKg?: number;
    order?: {
      id: string;
      orderNumber: string;
      status: string;
      receiverPhone?: string | null;
      codAmount?: number | null;
      requiresCod?: boolean;
      paymentMethod?: string | null;
      dropoffAddress?: { city: string; line1: string; contactName?: string };
    };
  } | null;
}

export interface BranchStats {
  totals: {
    inStock: number;
    incomingToday: number;
    outgoing: number;
    readyForPickup: number;
    pickedUpToday: number;
  };
}

export interface ParcelLabel {
  trackingNumber: string;
  orderNumber: string;
  pickupPin?: string | null;
  qrCode?: string | null;
  weightKg?: number;
  description?: string | null;
  receiverPhone?: string | null;
  status?: string;
  codAmount?: number | null;
  requiresCod?: boolean;
  paymentMethod?: string | null;
  branch?: { code: string; name: string; city: string };
}

export interface BranchRegisterInput {
  senderPhone: string;
  senderName: string;
  receiverPhone: string;
  receiverName: string;
  receiverGuzoId?: string;
  destinationBranchId?: string;
  dropoffLine1?: string;
  dropoffCity: string;
  weightKg: number;
  description?: string;
  fragile?: boolean;
  paymentMethod?: string;
}

export interface BranchRegisterResult extends BranchInventoryItem {
  label?: ParcelLabel;
}

export function getMyBranches(): Promise<BranchStaffAssignment[]> {
  return apiGet<BranchStaffAssignment[]>('/branch-staff/me');
}

export function getBranchStats(branchId: string): Promise<BranchStats> {
  return apiGet<BranchStats>(`/branches/${branchId}/stats`);
}

export function listBranchInventory(branchId: string, params: { page?: number; limit?: number; state?: string } = {}) {
  return apiList<BranchInventoryItem>(`/branches/${branchId}/inventory`, params);
}

export function lookupBranchShelf(branchId: string, shelfCode: string): Promise<BranchInventoryItem[]> {
  return apiGet<BranchInventoryItem[]>(`/branches/${branchId}/shelf/${encodeURIComponent(shelfCode)}`);
}

export function getParcelLabel(branchId: string, tracking: string): Promise<ParcelLabel> {
  return apiGet<ParcelLabel>(`/branches/${branchId}/labels/${encodeURIComponent(tracking)}`);
}

export function registerParcelAtBranch(branchId: string, input: BranchRegisterInput): Promise<BranchRegisterResult> {
  return apiPost<BranchRegisterResult>(`/branches/${branchId}/register`, input);
}

export function receiveAtBranch(
  branchId: string,
  input: { trackingNumber: string; shelfCode?: string; zone?: string; note?: string; weightKg?: number; description?: string },
): Promise<BranchInventoryItem> {
  return apiPost<BranchInventoryItem>(`/branches/${branchId}/receive`, {
    ...input,
    weightKg: input.weightKg != null ? String(input.weightKg) : undefined,
  });
}

export async function receiveIntakeAtBranch(
  branchId: string,
  input: {
    trackingNumber: string;
    shelfCode?: string;
    zone?: string;
    weightKg?: number;
    description?: string;
    photo?: { uri: string; name: string; type: string };
  },
): Promise<BranchInventoryItem> {
  const form = new FormData();
  form.append('trackingNumber', input.trackingNumber);
  if (input.shelfCode) form.append('shelfCode', input.shelfCode);
  if (input.zone) form.append('zone', input.zone);
  if (input.weightKg != null) form.append('weightKg', String(input.weightKg));
  if (input.description) form.append('description', input.description);
  if (input.photo) {
    form.append('photo', { uri: input.photo.uri, name: input.photo.name, type: input.photo.type } as unknown as Blob);
  }
  const { data } = await getApi().post<ApiResponse<BranchInventoryItem>>(`/branches/${branchId}/receive-intake`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export function assignBranchShelf(
  branchId: string,
  input: { trackingNumber: string; shelfCode: string; zone?: string },
): Promise<BranchInventoryItem> {
  return apiPost<BranchInventoryItem>(`/branches/${branchId}/shelf`, input);
}

export function confirmBranchPickup(
  branchId: string,
  input: { reference?: string; pin?: string; collectCod?: boolean },
): Promise<BranchInventoryItem> {
  const reference = input.reference?.trim() ?? '';
  const pin = input.pin?.trim();
  if (!reference && !pin) {
    return Promise.reject(new Error('Enter tracking number or pickup PIN'));
  }
  return apiPost<BranchInventoryItem>(`/branches/${branchId}/pickup`, {
    reference: reference || undefined,
    pin: pin || undefined,
    collectCod: input.collectCod ? 'true' : 'false',
  });
}

export function markBranchException(
  branchId: string,
  input: { trackingNumber: string; reason: string },
): Promise<BranchInventoryItem> {
  return apiPost<BranchInventoryItem>(`/branches/${branchId}/exception`, input);
}

export function parseTrackingCode(raw: string): string {
  const value = raw.trim();
  if (value.startsWith('GUZO:')) {
    const parts = value.split(':');
    return parts[1] ?? value;
  }
  if (value.includes('track/')) return value.split('track/').pop()!;
  return value;
}
