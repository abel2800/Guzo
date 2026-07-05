'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, MapPin, User, Clock, PenLine } from 'lucide-react';
import { fileUrl, type Order } from '@/lib/orders';
import { listMyDeliveries } from '@/lib/ops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export function PodHistory() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pod-history', page],
    queryFn: () => listMyDeliveries({ page, limit: 12, status: 'DELIVERED' }),
  });

  // Only completed deliveries that actually captured a proof photo.
  const orders = (data?.items ?? []).filter((o) => o.delivery?.proofFile);
  const meta = data?.meta;
  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proof of Delivery</h1>
        <p className="text-muted-foreground">Photos and signatures captured for your completed deliveries.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
            <FileText className="h-10 w-10" />
            <p className="font-semibold text-foreground">No proof of delivery yet</p>
            <p className="text-sm">Completed deliveries with a captured photo will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => (
            <button key={o.id} onClick={() => setSelectedId(o.id)} className="text-left">
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-[4/3] w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(o.delivery!.proofFile!.storageKey)}
                    alt={`Proof for ${o.orderNumber}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{o.orderNumber}</p>
                    <Badge variant="success">Delivered</Badge>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {o.dropoffAddress?.city} · {o.dropoffAddress?.line1}
                  </p>
                  {o.delivery?.deliveredAt && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(o.delivery.deliveredAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && <PodDetail order={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PodDetail({ order }: { order: Order }) {
  const d = order.delivery!;
  return (
    <div className="space-y-5">
      <div>
        <SheetTitle>{order.orderNumber}</SheetTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.pickupAddress?.city} → {order.dropoffAddress?.city}
        </p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fileUrl(d.proofFile!.storageKey)}
        alt="Proof of delivery"
        className="w-full rounded-lg border object-cover"
      />

      <div className="space-y-3 rounded-lg border p-4 text-sm">
        {d.recipientName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Received by <span className="font-medium">{d.recipientName}</span></span>
          </div>
        )}
        {d.deliveredAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(d.deliveredAt).toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-orange-600" />
          <span>{order.dropoffAddress?.line1}, {order.dropoffAddress?.city}</span>
        </div>
      </div>

      {d.signatureFile && (
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-sm font-medium">
            <PenLine className="h-3.5 w-3.5" /> Signature
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl(d.signatureFile.storageKey)}
            alt="Signature"
            className="h-24 rounded border bg-white p-1"
          />
        </div>
      )}
    </div>
  );
}
