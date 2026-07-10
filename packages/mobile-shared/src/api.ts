import axios, { type AxiosInstance, isAxiosError } from 'axios';
import type { ApiResponse, AuthTokens } from '@delivery/types';
import type { TokenStorage } from './storage';
import { formatApiError } from './validation';

function toClientError(error: unknown): Error {
  if (isAxiosError(error)) {
    const body = error.response?.data;
    if (body && typeof body === 'object' && 'success' in body && body.success === false) {
      return new Error(formatApiError(error, String('message' in body ? body.message : 'Request failed')));
    }
  }
  return new Error(formatApiError(error));
}

let client: AxiosInstance | null = null;
let storage: TokenStorage | null = null;
let onAuthError: (() => void) | null = null;

export function initMobileApi(baseURL: string, tokenStorage: TokenStorage, onLogout?: () => void) {
  storage = tokenStorage;
  onAuthError = onLogout ?? null;

  client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  client.interceptors.request.use(async (config) => {
    const token = await storage!.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshing: Promise<string | null> | null = null;

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      const status = error.response?.status;
      const refreshToken = await storage!.getRefreshToken();

      if (status === 401 && refreshToken && original && !original._retry) {
        original._retry = true;
        refreshing =
          refreshing ??
          axios
            .post<ApiResponse<{ tokens: AuthTokens }>>(`${baseURL}/auth/refresh`, { refreshToken })
            .then(async (r) => {
              if (r.data.success) {
                const { accessToken, refreshToken: rt } = r.data.data.tokens;
                await storage!.setTokens(accessToken, rt);
                return accessToken;
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
          return client!(original);
        }
        await storage!.clear();
        onAuthError?.();
      }
      return Promise.reject(toClientError(error));
    },
  );

  return client;
}

export function getApi(): AxiosInstance {
  if (!client) throw new Error('Mobile API not initialized — call initMobileApi first');
  return client;
}

export async function apiGet<T>(url: string): Promise<T> {
  const { data } = await getApi().get<ApiResponse<T>>(url);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await getApi().post<ApiResponse<T>>(url, body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await getApi().patch<ApiResponse<T>>(url, body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await getApi().delete(url);
}

function qs(params: Record<string, unknown>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) s.set(k, String(v));
  });
  return s.toString();
}

export async function apiList<T>(url: string, params: Record<string, unknown> = {}) {
  const q = qs(params);
  const { data } = await getApi().get<ApiResponse<T[]>>(`${url}${q ? `?${q}` : ''}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}
