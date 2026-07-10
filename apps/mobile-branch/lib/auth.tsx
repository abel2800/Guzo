import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@delivery/types';
import { initMobileApi, login as apiLogin, getMe, logout as apiLogout } from '@guzo/mobile-shared';
import { tokenStorage } from './storage';
import { API_URL } from './config';
import { initOfflineSupport } from './offline';

function requireBranchStaff(user: AuthUser) {
  if (!user.roles.includes('BRANCH_STAFF') && !user.roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'].includes(r))) {
    throw new Error('This app requires a branch staff account');
  }
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
          requireBranchStaff(me);
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
        requireBranchStaff(res.user);
        await tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        setUser(res.user);
      },
      async signOut() {
        const rt = await tokenStorage.getRefreshToken();
        try {
          if (rt) await apiLogout(rt);
        } catch {}
        await tokenStorage.clear();
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
