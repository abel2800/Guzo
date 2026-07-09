'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin, Navigation, Truck } from 'lucide-react';
import { listOrders, ORDER_STATUS_META, fileUrl, type Order } from '@/lib/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { EmptyPanel, FilterChip, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const LIST_KEY = 'merchant-orders';

export function MerchantOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [LIST_KEY, page, status],
    queryFn: () => listOrders({ page, limit: 10, status: status || undefined }),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;
  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Merchant shipment center"
        icon={Package}
        title="Orders"
        description="Monitor every merchant shipment in one premium control view, with route visibility, delivery status, and proof-of-delivery history."
        stats={[
          { label: 'Channel', value: 'Merchant' },
          { label: 'Tracking', value: 'Live ready' },
          { label: 'Mode', value: 'Scale ops' },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <FilterChip
            key={s || 'all'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            active={status === s}
          >
            {s ? ORDER_STATUS_META[s]?.label ?? s : 'All'}
          </FilterChip>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyPanel
              icon={Package}
              title="No orders yet"
              description="Create shipments from the Bulk Upload page."
            />
          ) : (
            <div className="divide-y">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-slate-400 md:grid">
                <div className="col-span-3">Order</div>
                <div className="col-span-4">Route</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              {orders.map((o) => {
                const m = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className="grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left text-sm transition-colors hover:bg-white/5 md:grid-cols-12"
                  >
                    <div className="md:col-span-3">
                      <p className="font-semibold text-white">{o.orderNumber}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString()} · {o.deliveryType}
                      </p>
                    </div>
                    <div className="hidden text-slate-300 md:col-span-4 md:block">
                      {`${o.pickupAddress?.city ?? '—'} -> ${o.dropoffAddress?.city ?? '—'}`}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    <div className="text-right font-medium md:col-span-3">
                      {o.currency} {o.totalAmount}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {meta.page} of {meta.totalPages} · {meta.total} orders
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
          {selected && <MerchantOrderDetail order={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MerchantOrderDetail({ order }: { order: Order }) {
  const m = ORDER_STATUS_META[order.status] ?? { label: order.status, variant: 'secondary' as const };
  const driver = order.delivery?.driver?.user;
  return (
    <div className="space-y-5">
      <div>
        <SheetTitle>{order.orderNumber}</SheetTitle>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={m.variant}>{m.label}</Badge>
          <span className="text-xs text-muted-foreground">{order.deliveryType}</span>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
          <span>{order.pickupAddress?.line1}, {order.pickupAddress?.city}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-orange-600" />
          <span>{order.dropoffAddress?.line1}, {order.dropoffAddress?.city}</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span>{driver ? `${driver.firstName} ${driver.lastName}` : 'No driver yet'}</span>
        </div>
        <div className="border-t pt-2 text-right font-semibold">
          {order.currency} {order.totalAmount}
        </div>
      </div>

      {order.delivery?.proofFile && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Proof of delivery</p>
          
          <img src={fileUrl(order.delivery.proofFile.storageKey)} alt="Proof" className="w-full rounded-lg border" />
        </div>
      )}

      {order.trackingEvents?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Tracking</p>
          <ol className="space-y-3">
            {[...order.trackingEvents].reverse().map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-sm">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{e.status}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
