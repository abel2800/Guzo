import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function FuturisticHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  stats?: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="dashboard-hero">
      <div className="dashboard-orb -right-8 top-0 h-24 w-24 bg-guzo-primary/20" />
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-guzo-primary/20 bg-guzo-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-guzo-primary">
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {eyebrow}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
          </div>
        </div>
      <div className="grid gap-3 grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FilterChip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-guzo-primary/40 bg-guzo-primary/15 text-foreground shadow-[0_0_30px_rgba(34,197,94,0.14)]'
          : 'border-border bg-muted/50 text-muted-foreground hover:border-guzo-primary/30 hover:bg-accent hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SearchField({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative max-w-xs flex-1', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="border-input bg-background pl-9 text-foreground placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  );
}

export function SectionMetaBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}

export function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground">
        <Icon className="h-8 w-8" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function DataTableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('dashboard-table-head', className)}>{children}</div>
  );
}

export function PaginationBar({
  page,
  totalPages,
  total,
  unit = 'items',
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  unit?: string;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onPageChange?: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const canPrev = hasPrev ?? page > 1;
  const canNext = hasNext ?? page < totalPages;
  const goPrev = onPrev ?? (() => onPageChange?.(Math.max(1, page - 1)));
  const goNext = onNext ?? (() => onPageChange?.(Math.min(totalPages, page + 1)));
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
        {total != null ? ` · ${total} ${unit}` : ''}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={goPrev}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={goNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function PanelSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('dashboard-select', className)} {...props} />;
}
