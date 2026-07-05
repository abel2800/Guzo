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

  // Always re-validate the session from the server (roles can change).
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
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background p-4 lg:block">
        {SidebarBody}
      </aside>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
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

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
