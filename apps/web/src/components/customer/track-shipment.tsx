'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation, Truck, CheckCircle2, Circle, Clock, Radio } from 'lucide-react';
import { trackOrder, fileUrl, ORDER_STATUS_META, TRACKING_STEPS, type Order } from '@/lib/orders';
import { useOrderSocket } from '@/lib/use-order-socket';
import { fetchRoute } from '@/lib/maps';
import { Map, type MapMarker } from '@/components/map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EmptyPanel, FuturisticHero, SearchField } from '@/components/dashboard/futuristic-primitives';
import { ParcelQrCard } from '@/components/shared/parcel-qr-card';

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

  useOrderSocket(order?.id, {
    onStatus: () => queryClient.invalidateQueries({ queryKey: ['track', active] }),
    onTracking: () => queryClient.invalidateQueries({ queryKey: ['track', active] }),
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Live tracking"
        icon={MapPin}
        title="Track Shipment"
        description="Enter an order or tracking number to see live status, route progress, and delivery history."
        stats={[
          { label: 'Map', value: 'Live GPS' },
          { label: 'ETA', value: 'Realtime' },
          { label: 'Proof', value: 'On delivery' },
        ]}
      />

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setActive(ref.trim());
        }}
      >
        <SearchField
          placeholder="e.g. ORD-XXXX or tracking number"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit">Track</Button>
      </form>

      {!active ? (
        <Card>
          <CardContent className="p-0">
            <EmptyPanel icon={MapPin} title="Enter a reference" description="Enter a reference above to start tracking." />
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

  const [liveDriver, setLiveDriver] = useState<{ lat: number; lng: number } | null>(null);

  useOrderSocket(order.id, {
    onTracking: (p) => {
      if (p.lat != null && p.lng != null) setLiveDriver({ lat: p.lat, lng: p.lng });
    },
  });

  const pickup =
    order.pickupAddress?.latitude != null && order.pickupAddress?.longitude != null
      ? { lat: order.pickupAddress.latitude, lng: order.pickupAddress.longitude }
      : null;
  const dropoff =
    order.dropoffAddress?.latitude != null && order.dropoffAddress?.longitude != null
      ? { lat: order.dropoffAddress.latitude, lng: order.dropoffAddress.longitude }
      : null;

  const driverFromOrder =
    order.delivery?.driver?.currentLat != null && order.delivery?.driver?.currentLng != null
      ? { lat: order.delivery.driver.currentLat, lng: order.delivery.driver.currentLng }
      : null;

  const lastEventCoords = [...order.trackingEvents].reverse().find((e) => e.latitude && e.longitude);
  const driverPos = liveDriver ?? driverFromOrder ?? (lastEventCoords ? { lat: lastEventCoords.latitude!, lng: lastEventCoords.longitude! } : null);

  const markers: MapMarker[] = [];
  if (pickup) markers.push({ lat: pickup.lat, lng: pickup.lng, color: '#16a34a', label: 'Pickup' });
  if (driverPos && !['DELIVERED', 'CANCELLED', 'FAILED', 'RETURNED'].includes(order.status)) {
    markers.push({ lat: driverPos.lat, lng: driverPos.lng, color: '#2563eb', label: 'Driver' });
  }
  if (dropoff) markers.push({ lat: dropoff.lat, lng: dropoff.lng, color: '#ea580c', label: 'Dropoff' });

  const routeKey = useMemo(() => {
    const parts = [pickup, driverPos, dropoff].filter(Boolean).map((p) => `${p!.lat},${p!.lng}`);
    return parts.join('|');
  }, [pickup, driverPos, dropoff]);

  const { data: routeData, isLoading: routeLoading } = useQuery({
    queryKey: ['track-route', routeKey],
    queryFn: () => {
      if (!pickup || !dropoff) return null;
      const via = driverPos ? [driverPos] : [];
      return fetchRoute(pickup, dropoff, via);
    },
    enabled: !!pickup && !!dropoff,
    staleTime: 60_000,
  });

  const route = routeData?.coordinates;

  const driverName = order.delivery?.driver?.user
    ? `${order.delivery.driver.user.firstName} ${order.delivery.driver.user.lastName}`
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <p className="text-lg font-bold text-foreground">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {order.pickupAddress?.city} → {order.dropoffAddress?.city} · {order.deliveryType}
              {routeData ? ` · ${routeData.distanceKm.toFixed(1)} km · ~${routeData.durationMin} min` : ''}
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

            {order.packages[0] && ['CONFIRMED', 'ASSIGNED', 'PENDING_PAYMENT'].includes(order.status) && (
              <div className="mt-6 rounded-lg border p-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground">Pickup barcode — show driver on arrival</p>
                <ParcelQrCard
                  value={order.packages[0].qrCode ?? order.packages[0].trackingNumber}
                  trackingNumber={order.packages[0].trackingNumber}
                  pickupPin={order.packages[0].pickupPin}
                />
              </div>
            )}

            {driverName && (
              <div className="mt-6 flex items-center gap-3 rounded-lg border p-3">
                {order.delivery?.driver?.user?.avatarUrl ? (
                  <img
                    src={order.delivery.driver.user.avatarUrl}
                    alt={driverName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Your driver</p>
                  <p className="text-sm font-medium">{driverName}</p>
                  {order.delivery?.vehicle && (
                    <p className="text-xs text-muted-foreground">
                      {order.delivery.vehicle.type.replace(/_/g, ' ')} · {order.delivery.vehicle.plateNumber}
                    </p>
                  )}
                  {driverPos && (
                    <p className="text-xs text-muted-foreground">Live on map</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="relative h-[420px] w-full">
            {routeLoading && markers.length > 0 && (
              <div className="absolute right-3 top-3 z-[500] rounded-full bg-black/50 px-2 py-1 text-xs text-foreground">
                Loading route…
              </div>
            )}
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
            {[...order.trackingEvents].reverse().map((e) => {
              const statusLabel = ORDER_STATUS_META[e.status]?.label ?? e.status;
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{statusLabel}</p>
                    {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                    {e.latitude != null && e.longitude != null && (
                      <p className="text-xs text-muted-foreground">
                        {e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
