import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface BranchAssignment {
  branchId: string;
  branch?: { id: string; code: string; name: string; city: string; line1?: string } | null;
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

export interface BranchInventoryItem {
  id: string;
  shelfCode?: string | null;
  zone?: string | null;
  receivedAt?: string;
  pickedUpAt?: string | null;
  measuredWeightKg?: number | null;
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
      dropoffAddress?: { city: string; line1: string; contactName?: string | null };
    };
  } | null;
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

export function getMyBranches(): Promise<BranchAssignment[]> {
  return apiGet<BranchAssignment[]>('/branch-staff/me');
}

export function getBranchStats(branchId: string): Promise<BranchStats> {
  return apiGet<BranchStats>(`/branches/${branchId}/stats`);
}

export async function listBranchInventory(
  branchId: string,
  params: { page?: number; limit?: number; state?: string } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const { data } = await api.get<ApiResponse<BranchInventoryItem[]>>(`/branches/${branchId}/inventory?${qs}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function receiveAtBranch(branchId: string, input: { trackingNumber: string; shelfCode?: string; zone?: string; weightKg?: number }) {
  const { data } = await api.post<ApiResponse<BranchInventoryItem>>(`/branches/${branchId}/receive`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function receiveIntakeAtBranch(
  branchId: string,
  input: {
    trackingNumber: string;
    shelfCode?: string;
    zone?: string;
    weightKg?: number;
    description?: string;
    photo: File;
  },
) {
  const form = new FormData();
  form.append('trackingNumber', input.trackingNumber);
  if (input.shelfCode) form.append('shelfCode', input.shelfCode);
  if (input.zone) form.append('zone', input.zone);
  if (input.weightKg != null) form.append('weightKg', String(input.weightKg));
  if (input.description) form.append('description', input.description);
  form.append('photo', input.photo);
  const { data } = await api.post<ApiResponse<BranchInventoryItem>>(`/branches/${branchId}/receive-intake`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function assignBranchShelf(
  branchId: string,
  input: { trackingNumber: string; shelfCode: string; zone?: string },
) {
  const { data } = await api.post<ApiResponse<BranchInventoryItem>>(`/branches/${branchId}/shelf`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function lookupBranchShelf(branchId: string, shelfCode: string): Promise<BranchInventoryItem[]> {
  return apiGet<BranchInventoryItem[]>(`/branches/${branchId}/shelf/${encodeURIComponent(shelfCode)}`);
}

export async function listBranches(city?: string) {
  const q = city ? `?city=${encodeURIComponent(city)}` : '';
  return apiGet<Array<{ id: string; code: string; name: string; city: string; line1: string; phone?: string | null }>>(`/branches${q}`);
}

export async function quoteBranchRegister(
  branchId: string,
  input: {
    senderPhone: string;
    senderName?: string;
    receiverPhone: string;
    receiverName?: string;
    destinationBranchId?: string;
    dropoffCity?: string;
    dropoffLine1?: string;
    weightKg: number;
  },
) {
  const { data } = await api.post<ApiResponse<{
    distanceKm: number;
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    totalAmount: number;
    currency: string;
    tax: number;
  }>>(`/branches/${branchId}/register-quote`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function registerParcelAtBranch(
  branchId: string,
  input: {
    senderPhone: string;
    senderName: string;
    receiverPhone: string;
    receiverName: string;
    destinationBranchId?: string;
    dropoffCity?: string;
    dropoffLine1?: string;
    weightKg: number;
    description?: string;
    fragile?: boolean;
    paymentMethod?: string;
    payLater?: boolean;
  },
) {
  const { data } = await api.post<ApiResponse<BranchInventoryItem & { label?: ParcelLabel }>>(`/branches/${branchId}/register`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function confirmBranchPickup(
  branchId: string,
  input: { reference?: string; pin?: string; collectCod?: boolean },
) {
  const reference = input.reference?.trim() ?? '';
  const pin = input.pin?.trim();
  if (!reference && !pin) throw new Error('Enter tracking number or pickup PIN');
  const { data } = await api.post<ApiResponse<BranchInventoryItem>>(`/branches/${branchId}/pickup`, {
    reference: reference || undefined,
    pin: pin || undefined,
    collectCod: input.collectCod ? 'true' : 'false',
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function markBranchException(branchId: string, input: { trackingNumber: string; reason: string }) {
  const { data } = await api.post<ApiResponse<BranchInventoryItem>>(`/branches/${branchId}/exception`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function getParcelLabel(branchId: string, tracking: string): Promise<ParcelLabel> {
  return apiGet<ParcelLabel>(`/branches/${branchId}/labels/${encodeURIComponent(tracking)}`);
}

export function printBranchLabel(label: ParcelLabel) {
  const qr = label.qrCode ?? label.trackingNumber;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qr)}`;
  const html = `<!DOCTYPE html><html><head><title>${label.trackingNumber}</title>
<style>body{font-family:Arial,sans-serif;padding:20px}.box{border:2px dashed #22c55e;padding:16px;border-radius:8px}
h1{font-size:20px;margin:0 0 8px}.pin{font-size:26px;font-weight:bold;letter-spacing:3px}.row{margin:6px 0;font-size:13px}
img{display:block;margin:12px 0}</style></head><body><div class="box">
<h1>GUZO Parcel</h1>
<div class="row"><strong>Tracking:</strong> ${label.trackingNumber}</div>
<div class="row"><strong>Order:</strong> ${label.orderNumber}</div>
<div class="row pin">PIN ${label.pickupPin ?? '—'}</div>
${label.requiresCod ? `<div class="row"><strong>COD:</strong> ETB ${label.codAmount ?? '—'}</div>` : ''}
<img src="${qrImg}" alt="QR" width="140" height="140" />
</div><script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open('', '_blank', 'width=420,height=520');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
