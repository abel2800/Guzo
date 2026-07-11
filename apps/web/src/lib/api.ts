'use client';

import axios, { type AxiosInstance } from 'axios';
import type { ApiResponse, AuthTokens } from '@delivery/types';
import { useAuthStore, authSelectors } from './auth-store';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4010/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = authSelectors.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refreshToken = authSelectors.getRefresh();

    if (status === 401 && refreshToken && original && !original._retry) {
      original._retry = true;
      refreshing =
        refreshing ??
        axios
          .post<ApiResponse<{ tokens: AuthTokens }>>(`${baseURL}/auth/refresh`, { refreshToken })
          .then((r) => {
            if (r.data.success) {
              useAuthStore.getState().setTokens(r.data.data.tokens);
              return r.data.data.tokens.accessToken;
            }
            return null;
          })
          .catch(() => null)
          .finally(() => {
            refreshing = null;
          });

      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      useAuthStore.getState().clear();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export async function apiGet<T>(url: string): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(url);
  if (!data.success) throw new Error(data.message);
  return data.data;
}
