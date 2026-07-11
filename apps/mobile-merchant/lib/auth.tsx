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
import { initOfflineSupport } from './offline';
import { setupPushNotifications } from './push';

const APP_SCOPE = 'merchant' as const;

function requireMerchant(user: AuthUser) {
  if (!user.roles.includes('MERCHANT')) {
    throw new Error('This app requires a merchant account. Use merchant@delivery.local');
  }
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  completeSession: (res: LoginResponse) => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
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
        if (await tokenStorage.getAccessToken()) {
          const me = await getMe();
          requireMerchant(me);
          setUser(me);
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
        requireMerchant(res.user);
        await tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        await setLastEmail(email.trim(), APP_SCOPE);
        if (await isBiometricHardwareAvailable()) {
          await setBiometricEnabled(true, APP_SCOPE);
        }
        setUser(res.user);
        void setupPushNotifications();
      },
      async completeSession(res) {
        requireMerchant(res.user);
        await tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        setUser(res.user);
        void setupPushNotifications();
      },
      async signInWithBiometrics() {
        const token = await tokenStorage.getAccessToken();
        if (!token) throw new Error('No saved session');
        const me = await getMe();
        requireMerchant(me);
        setUser(me);
      },
      async signOut() {
        const rt = await tokenStorage.getRefreshToken();
        try {
          if (rt) await apiLogout(rt);
        } catch {}
        await tokenStorage.clear();
        await clearBiometricPrefs(APP_SCOPE);
        setUser(null);
      },
      updateUser: setUser,
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
