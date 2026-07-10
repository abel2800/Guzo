'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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

export function CommandMenu({ config }: { config: RoleConfig }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const base = `/dashboard/${config.slug}`;

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
        <CommandInput placeholder="Search modules and actions..." />
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
        </CommandList>
      </CommandDialog>
    </>
  );
}
