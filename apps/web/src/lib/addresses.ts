import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface Address {
  id: string;
  label?: string | null;
  type: 'HOME' | 'OFFICE' | 'WAREHOUSE' | 'OTHER';
  contactName?: string | null;
  contactPhone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export type AddressInput = Pick<
  Address,
  'label' | 'type' | 'contactName' | 'contactPhone' | 'line1' | 'line2' | 'city' | 'state' | 'postalCode' | 'country' | 'isDefault'
>;

export function listAddresses(): Promise<Address[]> {
  return apiGet<Address[]>('/addresses');
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { data } = await api.post<ApiResponse<Address>>('/addresses', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  const { data } = await api.patch<ApiResponse<Address>>(`/addresses/${id}`, input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/addresses/${id}`);
}

export function formatAddress(a: Address): string {
  const parts = [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean);
  return parts.join(', ');
}
