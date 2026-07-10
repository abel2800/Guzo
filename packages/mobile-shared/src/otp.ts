import { apiPost } from './api';

export const OTP_RESEND_COOLDOWN_SEC = 60;

export const OTP_DEV_TERMINAL_HINT =
  'Development mode: your 6-digit code is printed in the API server terminal (look for [OTP stub]).';

export function sendOtp(phone: string): Promise<{ phone: string; message?: string }> {
  return apiPost<{ phone: string; message?: string }>('/otp/send', { phone });
}

export function verifyOtp(phone: string, code: string): Promise<void> {
  return apiPost('/otp/verify', { phone, code }).then(() => undefined);
}
