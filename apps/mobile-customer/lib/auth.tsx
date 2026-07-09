import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, LoginResponse } from '@delivery/types';
import {
  initMobileApi,
  login as apiLogin,
  getMe,
  logout as apiLogout,
  setLastEmail,
  setBiometricEnabled,
  isBiometricHardwareAvailable,
  clearBiometricPrefs,
} from '@guzo/mobile-shared';
import { tokenStorage } from './storage';
import { API_URL } from './config';
import { connectRealtime, disconnectSocket } from './realtime';
import { setupPushNotifications } from './push';
import { initOfflineSupport } from './offline';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  completeSession: (res: LoginResponse) => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initMobileApi(API_URL, tokenStorage, () => setUser(null));
    const unsubNet = initOfflineSupport();
    (async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          setUser(await getMe());
          connectRealtime();
          setupPushNotifications('customer').catch(() => undefined);
        }
      } catch {
        await tokenStorage.clear();
      } finally {
        setLoading(false);
      }
    })();
    return () => unsubNet();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const res = await apiLogin(email, password);
        await tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        await setLastEmail(email.trim(), 'customer');
        if (await isBiometricHardwareAvailable()) {
          await setBiometricEnabled(true, 'customer');
        }
        setUser(res.user);
        connectRealtime();
        setupPushNotifications('customer').catch(() => undefined);
      },
      async completeSession(res) {
        await tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        setUser(res.user);
        connectRealtime();
        setupPushNotifications('customer').catch(() => undefined);
      },
      async signInWithBiometrics() {
        const token = await tokenStorage.getAccessToken();
        if (!token) throw new Error('No saved session');
        setUser(await getMe());
        connectRealtime();
        setupPushNotifications('customer').catch(() => undefined);
      },
      async signOut() {
        const rt = await tokenStorage.getRefreshToken();
        try {
          if (rt) await apiLogout(rt);
        } catch {}
        await tokenStorage.clear();
        await clearBiometricPrefs('customer');
        disconnectSocket();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
