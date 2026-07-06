import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { Address, AddressInput } from './types';

export function listAddresses(): Promise<Address[]> {
  return apiGet<Address[]>('/addresses');
}

export function createAddress(input: AddressInput & { label?: string; isDefault?: boolean }): Promise<Address> {
  return apiPost<Address>('/addresses', input);
}

export function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  return apiPatch<Address>(`/addresses/${id}`, input);
}

export function deleteAddress(id: string): Promise<void> {
  return apiDelete(`/addresses/${id}`);
}
