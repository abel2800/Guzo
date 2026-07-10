'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Loader2, ClipboardList, CheckCircle2, Locate, Camera, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ORDER_STATUS_META, type Order, type OrderStatus } from '@/lib/orders';
import {
  listMyDeliveries,
  updateOrderStatus,
  markDeliveryFailed,
  reattemptDelivery,
  notifyDriverArrived,
  DRIVER_NEXT_STATUS,
  DRIVER_ALT_STATUS,
} from '@/lib/ops';
import { emitDriverLocation } from '@/lib/use-order-socket';
import { ProofOfDeliveryDialog } from '@/components/driver/proof-of-delivery';
import { PickupProofDialog } from '@/components/driver/pickup-proof-dialog';
import { PickupScanDialog } from '@/components/driver/pickup-scan-dialog';
import { BranchHandoffDialog } from '@/components/driver/branch-handoff-dialog';
import { SlideToConfirm } from '@/components/ui/slide-to-confirm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [podOrder, setPodOrder] = useState<Order | null>(null);
  const [pickupOrder, setPickupOrder] = useState<Order | null>(null);
  const [scanOrder, setScanOrder] = useState<Order | null>(null);
  const [handoffOrder, setHandoffOrder] = useState<Order | null>(null);
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(new Set());
  const [failId, setFailId] = useState<string | null>(null);
  const [failNote, setFailNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['driver-deliveries'],
    queryFn: () => listMyDeliveries({ limit: 50 }),
    refetchInterval: 20_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });

  const advance = useMutation({
    mutationFn: async ({ order, next }: { order: Order; next: OrderStatus }) => {
      const coords = await getPosition();
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
    onSuccess: () => { toast.success('Delivery updated'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusyId(null),
  });

  const reattempt = useMutation({
    mutationFn: (orderId: string) => reattemptDelivery(orderId),
    onMutate: (id) => setBusyId(id),
    onSuccess: () => { toast.success('Reattempt started'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusyId(null),
  });

  const markFailed = useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note?: string }) => markDeliveryFailed(orderId, note),
    onSuccess: () => { toast.success('Marked as failed'); setFailId(null); setFailNote(''); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const arrived = useMutation({
    mutationFn: async (orderId: string) => {
      const coords = await getPosition();
      return notifyDriverArrived(orderId, coords ?? {});
    },
    onSuccess: (_, orderId) => {
      setArrivedIds((s) => new Set(s).add(orderId));
      toast.success('Receiver notified — call and wait for collection');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const all = data?.items ?? [];
  const orders = all.filter((o) => !['DELIVERED', 'CANCELLED', 'RETURNED', 'FAILED'].includes(o.status));
  const failed = all.filter((o) => o.status === 'FAILED');
  const done = all.filter((o) => o.status === 'DELIVERED');

  function renderOrderCard(o: Order, options?: { showReattempt?: boolean }) {
    const m = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
    const step = DRIVER_NEXT_STATUS[o.status];
    const alts = DRIVER_ALT_STATUS[o.status] ?? [];
    const busy = busyId === o.id && (advance.isPending || reattempt.isPending);

    return (
      <Card key={o.id}>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{o.orderNumber}</p>
              <Badge variant={m.variant}>{m.label}</Badge>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-emerald-600" /> {o.pickupAddress?.city} · {o.pickupAddress?.line1}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-orange-600" /> {o.dropoffAddress?.city} · {o.dropoffAddress?.line1}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {o.status === 'ASSIGNED' && (
              <>
                <Button variant="default" size="sm" onClick={() => setScanOrder(o)}>
                  <Locate className="h-4 w-4" /> Scan pickup
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPickupOrder(o)}>
                  <Camera className="h-4 w-4" /> Photo proof
                </Button>
              </>
            )}
            {options?.showReattempt || o.status === 'FAILED' ? (
              <Button size="sm" onClick={() => reattempt.mutate(o.id)} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Reattempt
              </Button>
            ) : step ? (
              step.next === 'DELIVERED' ? (
                <Button onClick={() => setPodOrder(o)}>
                  <Camera className="h-4 w-4" /> {step.label}
                </Button>
              ) : step.slide ? (
                <SlideToConfirm
                  className="min-w-[220px]"
                  label={step.label}
                  onConfirm={() => { void advance.mutateAsync({ order: o, next: step.next }); }}
                  loading={busy}
                  disabled={busy}
                />
              ) : (
                <Button onClick={() => advance.mutate({ order: o, next: step.next })} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                  {step.label}
                </Button>
              )
            ) : null}
            {o.status === 'OUT_FOR_DELIVERY' && (
              <SlideToConfirm
                className="min-w-[220px]"
                tone="warning"
                label={arrivedIds.has(o.id) ? 'Receiver notified' : 'Slide — I have arrived'}
                onConfirm={() => { void arrived.mutateAsync(o.id); }}
                loading={arrived.isPending && busyId === o.id}
                disabled={arrivedIds.has(o.id) || (arrived.isPending && busyId === o.id)}
              />
            )}
            {alts.map((alt) =>
              alt.next === 'FAILED' ? (
                <Button key={alt.next} variant="outline" size="sm" onClick={() => setFailId(o.id)}>
                  <AlertTriangle className="h-4 w-4" /> {alt.label}
                </Button>
              ) : alt.next === 'AT_BRANCH' ? (
                <Button key={alt.next} variant="ghost" size="sm" onClick={() => setHandoffOrder(o)}>
                  {alt.label}
                </Button>
              ) : (
                <Button key={alt.next} variant="ghost" size="sm" onClick={() => advance.mutate({ order: o, next: alt.next })} disabled={busy}>
                  {alt.label}
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Driver operations"
        icon={ClipboardList}
        title="My Deliveries"
        description="Advance shipments with pickup proof, GPS-linked status, failed handling, and reattempts."
        stats={[
          { label: 'Active', value: String(orders.length) },
          { label: 'Failed', value: String(failed.length) },
          { label: 'POD', value: 'Photo + sig' },
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : orders.length === 0 && failed.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyPanel icon={ClipboardList} title="No active deliveries" description="Accept a job from Available to get started." /></CardContent></Card>
      ) : (
        <div className="space-y-4">{orders.map((o) => renderOrderCard(o))}</div>
      )}

      {failed.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-amber-400">Failed — needs reattempt</p>
          {failed.map((o) => renderOrderCard(o, { showReattempt: true }))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Recently delivered</p>
          {done.slice(0, 5).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => router.push(`/dashboard/driver/history`)}
              className="dashboard-list-row flex w-full items-center gap-2 rounded-lg border border-border px-4 py-2 text-left text-sm transition-colors hover:border-guzo-primary/40"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-foreground">{o.orderNumber}</span>
              <span className="text-muted-foreground">{o.pickupAddress?.city} → {o.dropoffAddress?.city}</span>
            </button>
          ))}
        </div>
      )}

      <ProofOfDeliveryDialog order={podOrder} open={!!podOrder} onOpenChange={(o) => !o && setPodOrder(null)} onCompleted={invalidate} />
      <PickupProofDialog order={pickupOrder} open={!!pickupOrder} onOpenChange={(o) => !o && setPickupOrder(null)} onCompleted={invalidate} />
      <PickupScanDialog order={scanOrder} open={!!scanOrder} onOpenChange={(o) => !o && setScanOrder(null)} onCompleted={invalidate} />
      <BranchHandoffDialog order={handoffOrder} open={!!handoffOrder} onOpenChange={(o) => !o && setHandoffOrder(null)} onCompleted={invalidate} />

      {failId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              <p className="font-semibold text-foreground">Mark delivery failed</p>
              <Input placeholder="Reason (optional)" value={failNote} onChange={(e) => setFailNote(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setFailId(null); setFailNote(''); }}>Cancel</Button>
                <Button variant="destructive" disabled={markFailed.isPending} onClick={() => markFailed.mutate({ orderId: failId, note: failNote || undefined })}>
                  {markFailed.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm failed'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
