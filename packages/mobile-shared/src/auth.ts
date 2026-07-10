import type { LoginResponse, RegisterResponse } from '@delivery/types';
import { isRegisterPending } from '@delivery/types';
import { apiGet, apiPost } from './api';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>('/auth/register', { ...input, role: input.role ?? 'CUSTOMER' });
}

export { isRegisterPending };

export function requestPasswordReset(input: {
  email?: string;
  phone?: string;
}): Promise<{ message: string; phone?: string }> {
  return apiPost<{ message: string; phone?: string }>('/auth/forgot-password', input);
}

/** @deprecated Use requestPasswordReset + verifyOtp + resetPasswordWithOtp */
export function forgotPassword(email: string): Promise<{ message: string }> {
  return requestPasswordReset({ email });
}

export function resetPasswordWithOtp(input: {
  email?: string;
  phone?: string;
  password: string;
}): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/reset-password', input);
}

export function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/reset-password', { token, password });
}

export function getMe(): Promise<LoginResponse['user'] & { walletBalance?: number; walletCurrency?: string }> {
  return apiGet('/auth/me');
}

export function logout(refreshToken?: string): Promise<void> {
  return apiPost('/auth/logout', { refreshToken }).then(() => undefined);
}
