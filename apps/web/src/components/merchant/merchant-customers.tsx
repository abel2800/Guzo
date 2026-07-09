'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { listMerchantCustomers } from '@/lib/merchant';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function MerchantCustomers() {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-customers'],
    queryFn: listMerchantCustomers,
  });

  const items = data ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Recipient directory"
        icon={Users}
        title="Customers"
        description="Recipients inferred from your shipment drop-off addresses and order history."
        stats={[{ label: 'Source', value: 'Orders' }]}
      />
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No customers yet" description="Shipments will populate this directory." icon={Users} />
      ) : (
        <div className="space-y-2">
          {items.map((c, i) => (
            <Card key={`${c.contactPhone}-${i}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-white">{c.contactName || 'Recipient'}</p>
                  <p className="text-sm text-muted-foreground">{c.contactPhone || 'No phone'}</p>
                  <p className="text-xs text-slate-400">{c.line1}, {c.city}</p>
                </div>
                <Badge>{c.orderCount} orders</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
