'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, MapPin } from 'lucide-react';
import { listMyDeliveries } from '@/lib/ops';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EmptyPanel,
  FuturisticHero,
  PaginationBar,
} from '@/components/dashboard/futuristic-primitives';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'destructive'> = {
  DELIVERED: 'success',
  FAILED: 'destructive',
  IN_TRANSIT: 'default',
  OUT_FOR_DELIVERY: 'default',
  ASSIGNED: 'secondary',
  PICKED_UP: 'secondary',
  AT_BRANCH: 'outline',
  AT_WAREHOUSE: 'outline',
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function DriverHistory() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-history', page],
    queryFn: () => listMyDeliveries({ page, limit: 15 }),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Trip log"
        icon={ScrollText}
        title="Delivery history"
        description="All jobs assigned to you — active, completed, and failed."
        stats={[
          { label: 'Page', value: String(page) },
          { label: 'Showing', value: String(orders.length) },
          { label: 'Total', value: meta?.total != null ? String(meta.total) : '—' },
        ]}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyPanel
              icon={ScrollText}
              title="No delivery history"
              description="Accepted and completed jobs will show up here."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="divide-y divide-white/5 p-0">
              {orders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{o.orderNumber}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {o.pickupAddress?.city} → {o.dropoffAddress?.city}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-300">ETB {Number(o.totalAmount).toLocaleString()}</span>
                    <Badge variant={STATUS_VARIANT[o.status] ?? 'outline'}>{formatStatus(o.status)}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {meta && meta.totalPages > 1 ? (
            <PaginationBar page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}
