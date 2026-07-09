import { apiGet } from './api';

export interface Branch {
  id: string;
  code: string;
  name: string;
  line1: string;
  city: string;
  state?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  openingHours?: string | null;
  queueLevel: number;
  warehouseId?: string | null;
  active: boolean;
}

export function listBranches(city?: string): Promise<Branch[]> {
  const q = city ? `?city=${encodeURIComponent(city)}` : '';
  return apiGet<Branch[]>(`/branches${q}`);
}

export function getBranch(id: string): Promise<Branch> {
  return apiGet<Branch>(`/branches/${id}`);
}
