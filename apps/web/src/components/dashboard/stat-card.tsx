import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative flex items-center justify-between p-5">
        <div className="dashboard-orb -right-6 top-3 h-16 w-16 bg-guzo-primary/20" />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-guzo-primary/15 text-guzo-primary shadow-[0_0_30px_rgba(34,197,94,0.18)]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
