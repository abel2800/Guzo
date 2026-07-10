'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

/** Ensures zustand persist finishes before dashboard gates on `hydrated`. */
export function AuthHydration() {
  useEffect(() => {
    const markHydrated = () => useAuthStore.setState({ hydrated: true });

    if (useAuthStore.persist.hasHydrated()) {
      markHydrated();
      return;
    }

    return useAuthStore.persist.onFinishHydration(markHydrated);
  }, []);

  return null;
}
