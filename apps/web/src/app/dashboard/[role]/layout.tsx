'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import type { ApiResponse, AuthUser } from '@delivery/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_CONFIG, SLUG_TO_ROLE, primarySlugForRoles, type RoleSlug } from '@/lib/roles';
import { GuzoLogo } from '@/components/guzo-logo';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { CommandMenu } from '@/components/dashboard/command-menu';
import { UserMenu } from '@/components/dashboard/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/shared/notification-center';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const slug = params.role as RoleSlug;
  const config = ROLE_CONFIG[slug];

  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const authReady = hydrated || Boolean(accessToken);

  const me = useQuery({
    queryKey: ['me'],
    enabled: authReady && !!accessToken,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
      if (!data.success) throw new Error(data.message);
      setUser(data.data);
      return data.data;
    },
    staleTime: 60_000,
    initialData: user ?? undefined,
  });

  const activeUser = me.data ?? user;

  useEffect(() => {
    if (!authReady) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (!config) {
      router.replace('/dashboard');
      return;
    }
    if (me.isError && !user) {
      useAuthStore.getState().clear();
      router.replace('/login');
      return;
    }
    if (activeUser) {
      const allowed =
        activeUser.roles.includes('SUPER_ADMIN') || activeUser.roles.includes(SLUG_TO_ROLE[slug]);
      if (!allowed) router.replace(`/dashboard/${primarySlugForRoles(activeUser.roles)}`);
    }
  }, [authReady, accessToken, config, activeUser, me.isError, user, slug, router]);

  if (!authReady || !config || (Boolean(accessToken) && me.isLoading && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="dashboard-shell relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="dashboard-orb left-0 top-0 h-72 w-72 bg-guzo-primary/15" />
        <div className="dashboard-orb right-0 top-24 h-80 w-80 bg-emerald-400/10" />
        <div className="dashboard-grid absolute inset-0 opacity-40" />
      </div>

      <aside
        className="glass fixed inset-y-4 left-4 z-40 hidden w-72 flex-col overflow-hidden rounded-[28px] p-5 lg:flex"
        aria-label="Main navigation"
      >
        <div className="shrink-0">
          <GuzoLogo />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <SidebarNav config={config} onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </aside>

      <div className="relative z-10 min-w-0 lg:pl-[19rem]">
        <div className="sticky top-0 z-30 px-4 pt-3 sm:pt-4 md:px-6 lg:px-6">
          <header className="glass flex h-14 min-w-0 items-center gap-2 rounded-2xl px-3 sm:h-16 sm:gap-3 sm:px-4">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(18rem,88vw)] flex-col border-border bg-background p-5 text-foreground">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="shrink-0 pb-4">
                  <GuzoLogo />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                  <SidebarNav config={config} onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <CommandMenu config={config} />
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
        </div>

        <main className="dashboard-content relative min-w-0 p-4 md:p-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
