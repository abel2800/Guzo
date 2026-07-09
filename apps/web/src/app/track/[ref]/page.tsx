'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin } from 'lucide-react';
import { trackOrder } from '@/lib/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export default function PublicTrackPage() {
  const params = useParams<{ ref: string }>();
  const ref = decodeURIComponent(params.ref ?? '');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['public-track', ref],
    queryFn: () => trackOrder(ref),
    enabled: !!ref,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center text-muted-foreground">
        No shipment found for <strong>{ref}</strong>
      </div>
    );
  }

  const pkg = order.packages[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <FuturisticHero
        eyebrow="Public tracking"
        icon={Package}
        title={order.orderNumber}
        description={`Status: ${order.status.replace(/_/g, ' ')}`}
        stats={[
          { label: 'Tracking', value: pkg?.trackingNumber ?? '—' },
          { label: 'Route', value: `${order.pickupAddress.city} → ${order.dropoffAddress.city}` },
          { label: 'Type', value: order.deliveryType },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Badge>{order.status.replace(/_/g, ' ')}</Badge>
            <span className="text-sm text-muted-foreground">{order.currency} {Number(order.totalAmount).toLocaleString()}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Pickup</p>
              <p className="text-muted-foreground">{order.pickupAddress.line1}, {order.pickupAddress.city}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Drop-off</p>
              <p className="text-muted-foreground">{order.dropoffAddress.line1}, {order.dropoffAddress.city}</p>
            </div>
          </div>
          {order.trackingEvents?.length ? (
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
              {order.trackingEvents.map((ev) => (
                <div key={ev.id} className="border-l-2 border-primary pl-3">
                  <p className="text-sm font-medium">{ev.description ?? ev.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
