'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, Plus } from 'lucide-react';
import { listOrders, ORDER_STATUS_META } from '@/lib/orders';
import { PARCEL_BUCKETS, groupOrdersByBucket, type ParcelBucketKey } from '@/lib/parcels';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
} from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'CONFIRMED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export function MyOrders() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page, status],
    queryFn: () => listOrders({ page, limit: 10, status: status || undefined }),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;
  const grouped = groupOrdersByBucket(orders);
  const bucketSummary = PARCEL_BUCKETS.map((b) => ({
    ...b,
    count: grouped[b.key].length,
  })).filter((b) => b.count > 0);
  const displayed = bucketFilter ? grouped[bucketFilter as ParcelBucketKey] ?? [] : orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Shipment hub"
            icon={Package}
            title="My Orders"
            description="Track and manage every shipment from booking through delivery in one premium customer view."
            stats={[
              { label: 'Tracking', value: 'Live status' },
              { label: 'History', value: 'Full archive' },
              { label: 'Action', value: 'Book new' },
            ]}
          />
        </div>
        <Button onClick={() => router.push('/dashboard/customer/book')}>
          <Plus className="h-4 w-4" /> New shipment
        </Button>
      </div>

      {bucketSummary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {bucketSummary.map((b) => (
            <FilterChip
              key={b.key}
              active={bucketFilter === b.key}
              onClick={() => {
                setBucketFilter((prev) => (prev === b.key ? '' : b.key));
                setPage(1);
              }}
            >
              {b.label} ({b.count})
            </FilterChip>
          ))}
        </div>
      )}

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
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyPanel
              icon={Package}
              title="No orders yet"
              description="Book your first shipment to see it here."
              action={<Button onClick={() => router.push('/dashboard/customer/book')}>Book a shipment</Button>}
            />
          ) : displayed.length === 0 ? (
            <EmptyPanel
              icon={Package}
              title="No orders in this group"
              description="Try another filter or book a new shipment."
              action={<Button onClick={() => router.push('/dashboard/customer/book')}>Book a shipment</Button>}
            />
          ) : (
            <div className="dashboard-divide">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-muted-foreground md:grid">
                <div className="col-span-3">Order</div>
                <div className="col-span-4">Route</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {displayed.map((o) => {
                const meta = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
                return (
                  <button
                    key={o.id}
                    onClick={() => router.push(`/dashboard/customer/track?ref=${o.orderNumber}`)}
                    className="dashboard-list-row grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left text-sm md:grid-cols-12"
                  >
                    <div className="md:col-span-3">
                      <p className="font-semibold text-foreground">{o.orderNumber}</p>
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

      {meta && (
        <PaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="orders"
          hasPrev={meta.hasPrev}
          hasNext={meta.hasNext}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
