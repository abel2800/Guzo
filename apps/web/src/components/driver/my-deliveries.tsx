'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Loader2, ClipboardList, CheckCircle2, Locate, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { ORDER_STATUS_META, type Order, type OrderStatus } from '@/lib/orders';
import { listMyDeliveries, updateOrderStatus, DRIVER_NEXT_STATUS } from '@/lib/ops';
import { emitDriverLocation } from '@/lib/use-order-socket';
import { ProofOfDeliveryDialog } from '@/components/driver/proof-of-delivery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

/** Best-effort browser geolocation; resolves undefined if unavailable/denied. */
function getPosition(): Promise<{ latitude: number; longitude: number } | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(undefined),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}

export function DriverDeliveries() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [podOrder, setPodOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-deliveries'],
    queryFn: () => listMyDeliveries({ limit: 50 }),
    refetchInterval: 20_000,
  });

  const advance = useMutation({
    mutationFn: async ({ order, next }: { order: Order; next: OrderStatus }) => {
      const coords = await getPosition();
      // Share GPS with watchers first so the customer map animates live.
      if (coords && order.delivery?.driverId) {
        emitDriverLocation({
          driverId: order.delivery.driverId,
          orderId: order.id,
          lat: coords.latitude,
          lng: coords.longitude,
          recordedAt: new Date().toISOString(),
        });
      }
      return updateOrderStatus(order.id, next, coords);
    },
    onMutate: ({ order }) => setBusyId(order.id),
    onSuccess: () => {
      toast.success('Delivery updated');
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusyId(null),
  });

  const orders = (data?.items ?? []).filter(
    (o) => !['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'].includes(o.status),
  );
  const done = (data?.items ?? []).filter((o) => o.status === 'DELIVERED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Deliveries</h1>
        <p className="text-muted-foreground">Advance each shipment through pickup, transit and delivery.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10" />
            <p className="font-semibold text-foreground">No active deliveries</p>
            <p className="text-sm">Accept a job from Available to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const m = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
            const step = DRIVER_NEXT_STATUS[o.status];
            const busy = busyId === o.id && advance.isPending;
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{o.orderNumber}</p>
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    <p className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-emerald-600" /> {o.pickupAddress?.city} · {o.pickupAddress?.line1}
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-orange-600" /> {o.dropoffAddress?.city} · {o.dropoffAddress?.line1}
                    </p>
                    {o.customer?.user && (
                      <p className="text-xs text-muted-foreground">
                        Recipient: {o.customer.user.firstName} {o.customer.user.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {step ? (
                      step.next === 'DELIVERED' ? (
                        <Button onClick={() => setPodOrder(o)}>
                          <Camera className="h-4 w-4" /> {step.label}
                        </Button>
                      ) : (
                        <Button onClick={() => advance.mutate({ order: o, next: step.next })} disabled={busy}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                          {step.label}
                        </Button>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">Awaiting next step</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Recently delivered</p>
          {done.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">{o.orderNumber}</span>
              <span className="text-muted-foreground">
                {o.pickupAddress?.city} → {o.dropoffAddress?.city}
              </span>
            </div>
          ))}
        </div>
      )}

      <ProofOfDeliveryDialog
        order={podOrder}
        open={!!podOrder}
        onOpenChange={(o) => !o && setPodOrder(null)}
        onCompleted={() => queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] })}
      />
    </div>
  );
}
