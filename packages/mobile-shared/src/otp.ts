import { apiPost } from './api';

export function sendOtp(phone: string): Promise<{ phone: string }> {
  return apiPost<{ phone: string }>('/otp/send', { phone });
}

export function verifyOtp(phone: string, code: string): Promise<void> {
  return apiPost('/otp/verify', { phone, code }).then(() => undefined);
}
