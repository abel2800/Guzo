import type { ApiResponse } from '@delivery/types';
import { api } from './api';

export async function sendOtp(phone: string): Promise<{ phone: string }> {
  const { data } = await api.post<ApiResponse<{ phone: string }>>('/otp/send', { phone });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function verifyOtp(phone: string, code: string): Promise<void> {
  const { data } = await api.post<ApiResponse<unknown>>('/otp/verify', { phone, code });
  if (!data.success) throw new Error(data.message);
}
