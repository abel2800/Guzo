'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, LifeBuoy, Truck } from 'lucide-react';
import { getExceptionCenter } from '@/lib/admin-platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import { StatCard } from '@/components/dashboard/stat-card';

export function AdminExceptionCenter() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-exceptions'],
    queryFn: getExceptionCenter,
    refetchInterval: 60_000,
  });

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Network health"
        icon={AlertTriangle}
        title="Exception center"
        description="Failed orders, lost parcels, delivery failures, and urgent support tickets in one view."
        stats={[
          { label: 'Failed', value: String(totals?.failedOrders ?? 0) },
          { label: 'Lost', value: String(totals?.lostPackages ?? 0) },
          { label: 'Urgent', value: String(totals?.urgentTickets ?? 0) },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Failed orders" value={totals?.failedOrders ?? 0} icon={Package} loading={isLoading} />
        <StatCard label="Lost parcels" value={totals?.lostPackages ?? 0} icon={AlertTriangle} loading={isLoading} />
        <StatCard label="Failed deliveries" value={totals?.failedDeliveries ?? 0} icon={Truck} loading={isLoading} />
        <StatCard label="Urgent tickets" value={totals?.urgentTickets ?? 0} icon={LifeBuoy} loading={isLoading} />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data ? (
        <EmptyPanel title="No data" description="Exception feed unavailable." icon={AlertTriangle} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ExceptionList title="Failed orders" items={data.failedOrders.map((o) => `${o.orderNumber} · ${o.status}`)} />
          <ExceptionList title="Lost packages" items={data.lostPackages.map((p) => p.trackingNumber)} />
          <ExceptionList title="Exception packages" items={data.exceptionPackages.map((p) => p.trackingNumber)} />
          <ExceptionList
            title="Failed deliveries"
            items={data.failedDeliveries.map((d) => `${d.orderNumber ?? d.id} — ${d.failureReason ?? 'unknown'}`)}
          />
          <ExceptionList
            title="Urgent tickets"
            items={data.urgentTickets.map((t) => `${t.ticketNumber}: ${t.subject}`)}
            badges={data.urgentTickets.map((t) => t.priority)}
          />
        </div>
      )}
    </div>
  );
}

function ExceptionList({ title, items, badges }: { title: string; items: string[]; badges?: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={`${item}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{item}</span>
                {badges?.[i] && <Badge variant="destructive">{badges[i]}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
