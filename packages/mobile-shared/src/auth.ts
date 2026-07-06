import type { AuthUser, LoginResponse } from '@delivery/types';
import { apiGet, apiPost } from './api';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>('/auth/me');
}

export function logout(refreshToken?: string): Promise<void> {
  return apiPost('/auth/logout', { refreshToken }).then(() => undefined);
}
