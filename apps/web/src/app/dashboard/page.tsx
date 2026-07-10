'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { primarySlugForRoles } from '@/lib/roles';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardIndex() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const authReady = hydrated || Boolean(accessToken);

  useEffect(() => {
    if (!authReady) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    const slug = primarySlugForRoles(user?.roles ?? ['CUSTOMER']);
    router.replace(`/dashboard/${slug}`);
  }, [authReady, accessToken, user, router]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton className="h-12 w-48" />
    </div>
  );
}
