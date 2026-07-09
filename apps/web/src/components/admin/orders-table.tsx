'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Search, Truck, User, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ORDER_STATUS_META, fileUrl, type Order } from '@/lib/orders';
import {
  listAllOrders,
  listDrivers,
  assignDriver,
  updateOrderStatus,
  ADMIN_STATUS_OPTIONS,
} from '@/lib/ops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { EmptyPanel, FilterChip, FuturisticHero, SearchField } from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const LIST_KEY = 'admin-orders';

export function AdminOrders() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [LIST_KEY, page, status, search],
    queryFn: () => listAllOrders({ page, limit: 10, status: status || undefined, search: search || undefined }),
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;
  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Operations command"
            icon={Package}
            title="Orders"
            description="Assign drivers, manage fulfilment, and control the full shipment lifecycle from a single premium operations board."
            stats={[
              { label: 'Dispatch', value: 'Driver assignment' },
              { label: 'Statuses', value: 'Full lifecycle' },
              { label: 'View', value: 'Ops live board' },
            ]}
          />
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <SearchField
            placeholder="Search order #"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-48"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyPanel icon={Package} title="No orders found" />
          ) : (
            <div className="divide-y">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-slate-400 md:grid">
                <div className="col-span-3">Order</div>
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Driver</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {orders.map((o) => {
                const m = ORDER_STATUS_META[o.status] ?? { label: o.status, variant: 'secondary' as const };
                const driver = o.delivery?.driver?.user;
                const customer = o.customer?.user;
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
                    <div className="hidden text-slate-300 md:col-span-3 md:block">
                      {customer ? `${customer.firstName} ${customer.lastName}` : '—'}
                    </div>
                    <div className="hidden text-slate-300 md:col-span-2 md:block">
                      {driver ? `${driver.firstName} ${driver.lastName}` : <span className="text-amber-600">Unassigned</span>}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    <div className="text-right font-medium md:col-span-2">
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
          {selected && <OrderDetail order={selected} onChanged={refresh} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrderDetail({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const m = ORDER_STATUS_META[order.status] ?? { label: order.status, variant: 'secondary' as const };
  const [driverId, setDriverId] = useState('');
  const [nextStatus, setNextStatus] = useState<string>(order.status);

  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: listDrivers });

  const assignMut = useMutation({
    mutationFn: () => assignDriver(order.id, driverId),
    onSuccess: () => {
      toast.success('Driver assigned');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: () => updateOrderStatus(order.id, nextStatus as Order['status']),
    onSuccess: () => {
      toast.success('Status updated');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const driver = order.delivery?.driver?.user;
  const customer = order.customer?.user;

  return (
    <div className="space-y-6">
      <div>
        <SheetTitle>{order.orderNumber}</SheetTitle>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={m.variant}>{m.label}</Badge>
          <span className="text-xs text-muted-foreground">{order.deliveryType}</span>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown customer'}</span>
        </div>
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
          <span>{driver ? `${driver.firstName} ${driver.lastName}` : 'No driver assigned'}</span>
        </div>
        <div className="border-t pt-2 text-right font-semibold">
          {order.currency} {order.totalAmount}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Assign driver</label>
        <div className="flex gap-2">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select a driver…</option>
            {(drivers ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.user ? `${d.user.firstName} ${d.user.lastName}` : d.driverCode} ({d.driverCode})
              </option>
            ))}
          </select>
          <Button onClick={() => assignMut.mutate()} disabled={!driverId || assignMut.isPending}>
            {assignMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Update status</label>
        <div className="flex gap-2">
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ADMIN_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_META[s]?.label ?? s}
              </option>
            ))}
          </select>
          <Button
            onClick={() => statusMut.mutate()}
            disabled={nextStatus === order.status || statusMut.isPending}
          >
            {statusMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
          </Button>
        </div>
      </div>

      {order.delivery?.proofFile && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Proof of delivery</p>
          
          <img
            src={fileUrl(order.delivery.proofFile.storageKey)}
            alt="Proof of delivery"
            className="w-full rounded-lg border object-cover"
          />
          {order.delivery.recipientName && (
            <p className="text-xs text-muted-foreground">Received by {order.delivery.recipientName}</p>
          )}
        </div>
      )}

      {order.trackingEvents?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">History</p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            {[...order.trackingEvents].reverse().slice(0, 6).map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span>{e.status}</span>
                <span>{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
