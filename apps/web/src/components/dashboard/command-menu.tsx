'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { RoleConfig } from '@/lib/roles';
import { globalSearch } from '@/lib/search';

export function CommandMenu({ config }: { config: RoleConfig }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const base = `/dashboard/${config.slug}`;
  const canSearchApi = ['admin', 'super-admin', 'support', 'operations'].includes(config.slug);

  const { data: searchData } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => globalSearch(query),
    enabled: open && canSearchApi && query.trim().length >= 2,
  });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-guzo-primary/30 hover:bg-accent hover:text-foreground sm:max-w-xs md:max-w-sm lg:w-64"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">Search modules...</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground lg:inline">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search modules and actions..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading={config.label}>
            {config.nav.map((item) => {
              const href = item.href ? `${base}/${item.href}` : base;
              const Icon = item.icon;
              return (
                <CommandItem key={href} value={item.title} onSelect={() => go(href)}>
                  <Icon />
                  {item.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
          {canSearchApi && searchData ? (
            <>
              {searchData.orders.length > 0 ? (
                <CommandGroup heading="Orders">
                  {searchData.orders.map((o) => (
                    <CommandItem key={o.id} value={o.orderNumber} onSelect={() => go(`${base}/orders`)}>
                      {o.orderNumber} · {o.status}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {searchData.users.length > 0 ? (
                <CommandGroup heading="Users">
                  {searchData.users.map((u) => (
                    <CommandItem key={u.id} value={u.email} onSelect={() => go(`${base}/users`)}>
                      {u.firstName} {u.lastName} · {u.email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {searchData.packages.length > 0 ? (
                <CommandGroup heading="Packages">
                  {searchData.packages.map((p) => (
                    <CommandItem key={p.id} value={p.trackingNumber} onSelect={() => go(`${base}/tracking`)}>
                      {p.trackingNumber} · {p.status}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
