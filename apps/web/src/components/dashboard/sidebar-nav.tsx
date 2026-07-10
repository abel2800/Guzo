'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { RoleConfig } from '@/lib/roles';
import { cn } from '@/lib/utils';

export function SidebarNav({
  config,
  onNavigate,
}: {
  config: RoleConfig;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/dashboard/${config.slug}`;

  function navigate(href: string) {
    onNavigate?.();
    if (pathname !== href) router.push(href);
  }

  return (
    <nav className="flex flex-col gap-1.5 py-1">
      {config.nav.map((item) => {
        const href = item.href ? `${base}/${item.href}` : base;
        const active = item.href
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === base;
        const Icon = item.icon;
        return (
          <button
            key={href}
            type="button"
            onClick={() => navigate(href)}
            className={cn(
              'relative z-10 flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200',
              active
                ? 'border-guzo-primary/40 bg-guzo-primary/15 text-foreground shadow-[0_0_30px_rgba(34,197,94,0.14)]'
                : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.title}
          </button>
        );
      })}
    </nav>
  );
}
