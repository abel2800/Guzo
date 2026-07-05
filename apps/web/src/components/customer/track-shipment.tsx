'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Navigation, Truck, CheckCircle2, Circle, Clock, Radio } from 'lucide-react';
import { trackOrder, fileUrl, ORDER_STATUS_META, TRACKING_STEPS, type Order } from '@/lib/orders';
import { useOrderSocket } from '@/lib/use-order-socket';
import { Map, type MapMarker } from '@/components/map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Maps every status onto the happy-path step index for the progress timeline.
const STATUS_TO_STEP: Record<string, number> = {
  PENDING_PAYMENT: -1,
  CONFIRMED: 0,
  ASSIGNED: 1,
  PICKED_UP: 2,
  IN_TRANSIT: 3,
  AT_WAREHOUSE: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
};

export function TrackShipment() {
  const params = useSearchParams();
  const [ref, setRef] = useState('');
  const [active, setActive] = useState('');

  useEffect(() => {
    const q = params.get('ref');
    if (q) {
      setRef(q);
      setActive(q);
    }
  }, [params]);

  const queryClient = useQueryClient();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['track', active],
    queryFn: () => trackOrder(active),
    enabled: !!active,
    refetchInterval: 15_000,
  });

  // Live updates: refetch the moment a status change or GPS ping arrives.
  useOrderSocket(order?.id, {
    onStatus: () => queryClient.invalidateQueries({ queryKey: ['track', active] }),
    onTracking: () => queryClient.invalidateQueries({ queryKey: ['track', active] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Track Shipment</h1>
        <p className="text-muted-foreground">Enter an order or tracking number to see live status.</p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setActive(ref.trim());
        }}
      >
        <Input placeholder="e.g. ORD-XXXX or tracking number" value={ref} onChange={(e) => setRef(e.target.value)} />
        <Button type="submit">
          <Search className="h-4 w-4" /> Track
        </Button>
      </form>

      {!active ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-20 text-center text-muted-foreground">
            <MapPin className="h-10 w-10" />
            <p>Enter a reference above to start tracking.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError || !order ? (
        <Card>
          <CardContent className="py-16 text-center text-destructive">
            No shipment found for “{active}”.
          </CardContent>
        </Card>
      ) : (
        <TrackingDetails order={order} />
      )}
    </div>
  );
}

function TrackingDetails({ order }: { order: Order }) {
  const meta = ORDER_STATUS_META[order.status] ?? { label: order.status, variant: 'secondary' as const };
  const currentStep = STATUS_TO_STEP[order.status] ?? 0;
  const cancelled = ['CANCELLED', 'FAILED', 'RETURNED'].includes(order.status);

  const lastWithCoords = [...order.trackingEvents].reverse().find((e) => e.latitude && e.longitude);
  const markers: MapMarker[] = [];
  if (order.pickupAddress?.latitude && order.pickupAddress?.longitude)
    markers.push({ lat: order.pickupAddress.latitude, lng: order.pickupAddress.longitude, color: '#16a34a', label: 'Pickup' });
  if (lastWithCoords)
    markers.push({ lat: lastWithCoords.latitude!, lng: lastWithCoords.longitude!, color: '#2563eb', label: 'Current' });
  if (order.dropoffAddress?.latitude && order.dropoffAddress?.longitude)
    markers.push({ lat: order.dropoffAddress.latitude, lng: order.dropoffAddress.longitude, color: '#ea580c', label: 'Dropoff' });
  const route = markers.length >= 2 ? (markers.map((m) => [m.lat, m.lng]) as Array<[number, number]>) : undefined;

  const driverName = order.delivery?.driver?.user
    ? `${order.delivery.driver.user.firstName} ${order.delivery.driver.user.lastName}`
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <p className="text-lg font-bold">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {order.pickupAddress?.city} → {order.dropoffAddress?.city} · {order.deliveryType}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              {!cancelled && order.status !== 'DELIVERED' && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <Radio className="h-3 w-3 animate-pulse" /> Live
                </span>
              )}
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            {order.estimatedDeliveryAt && (
              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> ETA {new Date(order.estimatedDeliveryAt).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {cancelled ? (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                This shipment is {meta.label.toLowerCase()}.
              </div>
            ) : (
              <ol className="relative space-y-6 before:absolute before:left-[11px] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                {TRACKING_STEPS.map((s, i) => {
                  const done = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <li key={s.key} className="relative flex items-start gap-3">
                      {done ? (
                        <CheckCircle2 className={cn('h-6 w-6 shrink-0', isCurrent ? 'text-primary' : 'text-emerald-500')} />
                      ) : (
                        <Circle className="h-6 w-6 shrink-0 text-muted-foreground/40" />
                      )}
                      <div className="pt-0.5">
                        <p className={cn('text-sm font-medium', !done && 'text-muted-foreground')}>{s.label}</p>
                        {isCurrent && <p className="text-xs text-primary">Current status</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {driverName && (
              <div className="mt-6 flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="text-sm font-medium">{driverName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="h-[420px] w-full">
            {markers.length ? (
              <Map markers={markers} route={route} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No location data available for this shipment.
              </div>
            )}
          </div>
        </Card>
      </div>

      {order.delivery?.proofFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Proof of Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[220px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl(order.delivery.proofFile.storageKey)}
              alt="Proof of delivery"
              className="w-full rounded-lg border object-cover"
            />
            <div className="space-y-3 text-sm">
              {order.delivery.recipientName && (
                <div>
                  <p className="text-xs text-muted-foreground">Received by</p>
                  <p className="font-medium">{order.delivery.recipientName}</p>
                </div>
              )}
              {order.delivery.deliveredAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Delivered at</p>
                  <p className="font-medium">{new Date(order.delivery.deliveredAt).toLocaleString()}</p>
                </div>
              )}
              {order.delivery.signatureFile && (
                <div>
                  <p className="text-xs text-muted-foreground">Signature</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(order.delivery.signatureFile.storageKey)}
                    alt="Signature"
                    className="mt-1 h-20 rounded border bg-white p-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {[...order.trackingEvents].reverse().map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{e.status}</p>
                  {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
