import type { UserProfile } from '@delivery/types';
import { apiGet, apiPatch, getApi } from './api';

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function getProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/auth/me');
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  return apiPatch<UserProfile>('/auth/me', input);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiPatch<null>('/auth/me/password', input);
}

export async function uploadAvatar(uri: string, fileName = 'avatar.jpg', mimeType = 'image/jpeg'): Promise<UserProfile> {
  const form = new FormData();
  form.append('avatar', { uri, name: fileName, type: mimeType } as unknown as Blob);
  const { data } = await getApi().post<{ success: boolean; message: string; data: UserProfile }>(
    '/auth/me/avatar',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  if (!data.success) throw new Error(data.message);
  return data.data;
}
