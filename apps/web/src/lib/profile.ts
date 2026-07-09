import { api, apiGet } from './api';
import type { ApiResponse, UserProfile } from '@delivery/types';

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';
};

export type UpdateLocationInput = {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function getProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/auth/me');
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const { data } = await api.patch<ApiResponse<UserProfile>>('/auth/me', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateProfileLocation(input: UpdateLocationInput): Promise<UserProfile> {
  const { data } = await api.patch<ApiResponse<UserProfile>>('/auth/me/location', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const { data } = await api.patch<ApiResponse<null>>('/auth/me/password', input);
  if (!data.success) throw new Error(data.message);
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await api.post<ApiResponse<UserProfile>>('/auth/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success) throw new Error(data.message);
  return data.data;
}
