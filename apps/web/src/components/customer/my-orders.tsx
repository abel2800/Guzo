'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, Plus } from 'lucide-react';
import { listOrders, ORDER_STATUS_META } from '@/lib/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_FILTERS = ['', 'CONFIRMED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export function MyOrders() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page, status],
    queryFn: () => listOrders({ page, limit: 10, status: status || undefined }),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your shipments.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/customer/book')}>
          <Plus className="h-4 w-4" /> New shipment
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              status === s ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {s ? ORDER_STATUS_META[s]?.label ?? s : 'All'}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Package className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm text-muted-foreground">Book your first shipment to see it here.</p>
              <Button onClick={() => router.push('/dashboard/customer/book')}>Book a shipment</Button>
            </div>
          ) : (
            <div className="divide-y">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-muted-foreground md:grid">
                <div className="col-span-3">Order</div>
                <div className="col-span-4">Route</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {orders.map((o) => {
                const meta = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
                return (
                  <button
                    key={o.id}
                    onClick={() => router.push(`/dashboard/customer/track?ref=${o.orderNumber}`)}
                    className="grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left text-sm transition-colors hover:bg-muted/50 md:grid-cols-12"
                  >
                    <div className="md:col-span-3">
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString()} · {o.deliveryType}
                      </p>
                    </div>
                    <div className="hidden text-muted-foreground md:col-span-4 md:block">
                      {o.pickupAddress?.city} → {o.dropoffAddress?.city}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <div className="text-right font-medium md:col-span-2">
                      {o.currency} {o.totalAmount}
                    </div>
                    <div className="hidden justify-end md:col-span-1 md:flex">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
          <p className="text-sm text-muted-foreground">
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
    </div>
  );
}
