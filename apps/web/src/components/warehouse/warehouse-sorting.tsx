'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Boxes, ChevronDown, ChevronRight, Warehouse } from 'lucide-react';
import { getInventoryByCity, PACKAGE_STATUS_META, type InventoryItem } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import { Button } from '@/components/ui/button';

export function WarehouseSorting() {
  const warehouseId = useSelectedWarehouse();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['wh-by-city', warehouseId],
    queryFn: () => getInventoryByCity(warehouseId!),
    enabled: !!warehouseId,
  });

  const groups = data ?? [];
  const total = groups.reduce((sum, g) => sum + g.count, 0);

  const toggle = (city: string) => setExpanded((prev) => ({ ...prev, [city]: !prev[city] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Sort floor"
            icon={MapPin}
            title="Sorting by destination"
            description="Parcels grouped by drop-off city for lane assignment and outbound planning."
            stats={[
              { label: 'Cities', value: String(groups.length) },
              { label: 'In stock', value: String(total) },
              { label: 'View', value: 'Expand' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      {!warehouseId ? (
        <EmptyPanel icon={Warehouse} title="Select a warehouse" description="Choose a warehouse to view sorting lanes." />
      ) : isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : groups.length === 0 ? (
        <EmptyPanel title="No parcels in stock" description="Receive parcels first to populate sorting lanes." icon={Boxes} />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = expanded[group.city] ?? true;
            return (
              <Card key={group.city}>
                <CardHeader className="cursor-pointer py-4" onClick={() => toggle(group.city)}>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <MapPin className="h-4 w-4 text-primary" />
                      {group.city}
                    </span>
                    <Badge variant="secondary">{group.count} parcels</Badge>
                  </CardTitle>
                </CardHeader>
                {open && (
                  <CardContent className="space-y-2 border-t pt-4">
                    {group.parcels.map((item: InventoryItem) => {
                      const meta = PACKAGE_STATUS_META[item.package.status] ?? { label: item.package.status, variant: 'outline' as const };
                      return (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                          <div>
                            <p className="font-mono font-medium">{item.package.trackingNumber}</p>
                            <p className="text-muted-foreground">{item.package.order?.dropoffAddress?.line1}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.shelfCode && <Badge variant="outline">Shelf {item.shelfCode}</Badge>}
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
