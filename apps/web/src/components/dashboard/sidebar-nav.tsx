'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { RoleConfig } from '@/lib/roles';
import { cn } from '@/lib/utils';

export function SidebarNav({ config }: { config: RoleConfig }) {
  const pathname = usePathname();
  const base = `/dashboard/${config.slug}`;

  return (
    <nav className="flex flex-col gap-1.5">
      {config.nav.map((item) => {
        const href = item.href ? `${base}/${item.href}` : base;
        const active = item.href ? pathname.startsWith(href) : pathname === base;
        const Icon = item.icon;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative z-10 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
              active
                ? 'border-guzo-primary/40 bg-guzo-primary/15 text-white shadow-[0_0_30px_rgba(34,197,94,0.14)]'
                : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white',
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
