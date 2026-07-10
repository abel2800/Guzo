'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, MapPin, User, Clock, PenLine } from 'lucide-react';
import { fileUrl, type Order } from '@/lib/orders';
import { listMyDeliveries } from '@/lib/ops';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  EmptyPanel,
  FuturisticHero,
  PaginationBar,
} from '@/components/dashboard/futuristic-primitives';

export function PodHistory() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pod-history', page],
    queryFn: () => listMyDeliveries({ page, limit: 12, status: 'DELIVERED' }),
  });

  const orders = (data?.items ?? []).filter((o) => o.delivery?.proofFile);
  const meta = data?.meta;
  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Delivery archive"
        icon={FileText}
        title="Proof of Delivery"
        description="Photos and signatures captured for your completed deliveries in a searchable visual archive."
        stats={[
          { label: 'Photos', value: 'Captured' },
          { label: 'Signatures', value: 'Stored' },
          { label: 'History', value: 'Full trail' },
        ]}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyPanel
              icon={FileText}
              title="No proof of delivery yet"
              description="Completed deliveries with a captured photo will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => (
            <button key={o.id} onClick={() => setSelectedId(o.id)} className="text-left">
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-[4/3] w-full bg-muted/40">
                  
                  <img
                    src={fileUrl(o.delivery!.proofFile!.storageKey)}
                    alt={`Proof for ${o.orderNumber}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{o.orderNumber}</p>
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

      {meta && (
        <PaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="deliveries"
          hasPrev={meta.hasPrev}
          hasNext={meta.hasNext}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
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
