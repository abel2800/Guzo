import type { LoginResponse } from '@delivery/types';
import { apiGet, apiPost } from './api';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: string;
}): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/register', { ...input, role: input.role ?? 'CUSTOMER' });
}

export function getMe(): Promise<LoginResponse['user'] & { walletBalance?: number; walletCurrency?: string }> {
  return apiGet('/auth/me');
}

export function logout(refreshToken?: string): Promise<void> {
  return apiPost('/auth/logout', { refreshToken }).then(() => undefined);
}
