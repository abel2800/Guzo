'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, AlertTriangle, Warehouse } from 'lucide-react';
import { getAgingReport } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import { Badge } from '@/components/ui/badge';

export function WarehouseAging() {
  const warehouseId = useSelectedWarehouse();

  const { data, isLoading } = useQuery({
    queryKey: ['wh-aging', warehouseId],
    queryFn: () => getAgingReport(warehouseId!),
    enabled: !!warehouseId,
  });

  const buckets = data?.buckets;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Inventory health"
            icon={Clock}
            title="Aging report"
            description="How long parcels have been sitting in the warehouse — flag stale stock."
            stats={[
              { label: '<24h', value: 'Fresh' },
              { label: '7d+', value: 'Stale' },
              { label: 'Action', value: 'Prioritize' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      {!warehouseId ? (
        <EmptyPanel icon={Warehouse} title="Select a warehouse" description="Choose a warehouse to view aging buckets." />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Under 24h" value={buckets?.under24h ?? 0} icon={Clock} />
            <StatCard label="1–3 days" value={buckets?.oneToThreeDays ?? 0} icon={Clock} />
            <StatCard label="3–7 days" value={buckets?.threeToSevenDays ?? 0} icon={Clock} />
            <StatCard label="Over 7 days" value={buckets?.overSevenDays ?? 0} icon={AlertTriangle} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Stale parcels (7+ days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.stale.length ? (
                <p className="text-sm text-muted-foreground">No stale parcels — inventory is moving well.</p>
              ) : (
                <div className="space-y-2">
                  {data.stale.map((row) => (
                    <div key={row.trackingNumber} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                      <span className="font-mono font-medium">{row.trackingNumber}</span>
                      <div className="flex items-center gap-2">
                        {row.shelfCode && <Badge variant="outline">Shelf {row.shelfCode}</Badge>}
                        <Badge variant="destructive">{row.hoursInStock}h in stock</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
