'use client';

import { useEffect } from 'react';
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
  const slug = params.role as RoleSlug;
  const config = ROLE_CONFIG[slug];

  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

    const me = useQuery({
    queryKey: ['me'],
    enabled: hydrated && !!accessToken,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
      if (!data.success) throw new Error(data.message);
      setUser(data.data);
      return data.data;
    },
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (!config) {
      router.replace('/dashboard');
      return;
    }
    if (me.data) {
      const allowed =
        me.data.roles.includes('SUPER_ADMIN') || me.data.roles.includes(SLUG_TO_ROLE[slug]);
      if (!allowed) router.replace(`/dashboard/${primarySlugForRoles(me.data.roles)}`);
    }
  }, [hydrated, accessToken, config, me.data, slug, router]);

  if (!hydrated || !config || me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  const SidebarBody = (
    <div className="flex h-full flex-col gap-6">
      <GuzoLogo />
      <SidebarNav config={config} />
    </div>
  );

  return (
    <div className="dashboard-shell relative min-h-screen overflow-hidden">
      <div className="dashboard-orb left-0 top-0 h-72 w-72 bg-guzo-primary/15" />
      <div className="dashboard-orb right-0 top-24 h-80 w-80 bg-emerald-400/10" />
      <div className="dashboard-grid pointer-events-none absolute inset-0 opacity-40" />
      
      <aside className="glass fixed inset-y-4 left-4 z-40 hidden w-72 rounded-[28px] p-5 lg:block">
        {SidebarBody}
      </aside>

      <div className="relative z-10 lg:pl-[19rem]">
        
        <header className="glass sticky top-4 z-30 mx-4 mt-4 flex h-16 items-center gap-3 rounded-2xl px-4 md:mx-6 lg:ml-0 lg:mr-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-white/10 bg-[#09101f]/95 text-white">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {SidebarBody}
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <CommandMenu config={config} />
          </div>
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
        </header>

        <main className="relative p-4 md:p-6 lg:pr-6">{children}</main>
      </div>
    </div>
  );
}
