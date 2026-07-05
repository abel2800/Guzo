import axios, { type AxiosInstance } from 'axios';
import type { ApiResponse, AuthTokens } from '@delivery/types';

export interface ApiClientOptions {
  baseURL: string;
  /** Returns the current access token (e.g. from localStorage/zustand). */
  getAccessToken?: () => string | null;
  /** Returns the current refresh token. */
  getRefreshToken?: () => string | null;
  /** Persist refreshed tokens. */
  onTokensRefreshed?: (tokens: AuthTokens) => void;
  /** Called when refresh fails (force logout). */
  onAuthError?: () => void;
}

/**
 * Shared axios client used by every frontend. Attaches the Bearer token and
 * transparently refreshes it on a 401 using the refresh token (single-flight).
 */
export function createApiClient(opts: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: opts.baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = opts.getAccessToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshing: Promise<string | null> | null = null;

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      const status = error.response?.status;
      const refreshToken = opts.getRefreshToken?.();

      if (status === 401 && refreshToken && !original._retry) {
        original._retry = true;
        refreshing =
          refreshing ??
          client
            .post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', { refreshToken })
            .then((r) => {
              const body = r.data;
              if (body.success) {
                opts.onTokensRefreshed?.(body.data.tokens);
                return body.data.tokens.accessToken;
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
          return client(original);
        }
        opts.onAuthError?.();
      }
      return Promise.reject(error);
    },
  );

  return client;
}
