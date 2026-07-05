'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Search, MapPin, Loader2, Truck, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  listInventory,
  sortParcel,
  dispatchParcel,
  PACKAGE_STATUS_META,
  type InventoryItem,
} from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const STATES = [
  { key: 'in-stock', label: 'In stock' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'all', label: 'All' },
] as const;

export function WarehouseInventory() {
  const warehouseId = useSelectedWarehouse();
  const queryClient = useQueryClient();
  const [state, setState] = useState<'in-stock' | 'dispatched' | 'all'>('in-stock');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [shelfCode, setShelfCode] = useState('');
  const [zone, setZone] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['wh-inventory', warehouseId, state, search, page],
    queryFn: () => listInventory(warehouseId!, { state, search: search || undefined, page, limit: 10 }),
    enabled: !!warehouseId,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['wh-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['wh-stats'] });
  };

  const openSort = (item: InventoryItem) => {
    setSelected(item);
    setShelfCode(item.shelfCode ?? '');
    setZone(item.zone ?? '');
  };

  const sort = useMutation({
    mutationFn: () => sortParcel(warehouseId!, { trackingNumber: selected!.package.trackingNumber, shelfCode, zone: zone || undefined }),
    onSuccess: () => {
      toast.success('Parcel sorted');
      setSelected(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dispatch = useMutation({
    mutationFn: (item: InventoryItem) => dispatchParcel(warehouseId!, { trackingNumber: item.package.trackingNumber }),
    onSuccess: () => {
      toast.success('Parcel dispatched');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Sort parcels onto shelves and dispatch for delivery.</p>
        </div>
        <WarehouseSelect />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {STATES.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setState(s.key);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                state === s.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search tracking / barcode"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Boxes className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No parcels here</p>
              <p className="text-sm text-muted-foreground">Receive parcels to build up inventory.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const m = PACKAGE_STATUS_META[item.package.status] ?? { label: item.package.status, variant: 'secondary' as const };
                const dispatched = !!item.dispatchedAt;
                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div className="min-w-[180px]">
                      <p className="font-semibold">{item.package.trackingNumber}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {item.package.order.dropoffAddress?.city ?? '—'} ·{' '}
                        {item.package.order.orderNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.shelfCode ? (
                        <Badge variant="outline" className="gap-1">
                          <Tag className="h-3 w-3" /> {item.shelfCode}
                          {item.zone ? ` · ${item.zone}` : ''}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No shelf</span>
                      )}
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    {!dispatched && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openSort(item)}>
                          <Tag className="h-4 w-4" /> Sort
                        </Button>
                        <Button size="sm" onClick={() => dispatch.mutate(item)} disabled={dispatch.isPending}>
                          {dispatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                          Dispatch
                        </Button>
                      </div>
                    )}
                    {dispatched && (
                      <span className="text-xs text-muted-foreground">
                        Dispatched {new Date(item.dispatchedAt!).toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} parcels
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

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <div className="space-y-5">
              <SheetTitle>Sort {selected.package.trackingNumber}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Assign a shelf location for this parcel. Order {selected.package.order.orderNumber}.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="s-shelf">Shelf code</Label>
                <Input id="s-shelf" placeholder="A-12" value={shelfCode} onChange={(e) => setShelfCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-zone">Zone (optional)</Label>
                <Input id="s-zone" placeholder="Zone A" value={zone} onChange={(e) => setZone(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => sort.mutate()} disabled={!shelfCode || sort.isPending}>
                {sort.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                Save shelf
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
