'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { RoleConfig } from '@/lib/roles';
import { cn } from '@/lib/utils';

export function SidebarNav({ config }: { config: RoleConfig }) {
  const pathname = usePathname();
  const base = `/dashboard/${config.slug}`;

  return (
    <nav className="flex flex-col gap-1">
      {config.nav.map((item) => {
        const href = item.href ? `${base}/${item.href}` : base;
        const active = item.href ? pathname.startsWith(href) : pathname === base;
        const Icon = item.icon;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
