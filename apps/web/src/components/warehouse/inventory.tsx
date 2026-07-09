'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, MapPin, Loader2, Truck, Tag, Printer, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  listInventory,
  sortParcel,
  dispatchParcel,
  transferParcel,
  listWarehouses,
  printWarehouseLabel,
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
import { EmptyPanel, FilterChip, FuturisticHero, SearchField } from '@/components/dashboard/futuristic-primitives';

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
  const [transferDest, setTransferDest] = useState('');

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses,
  });

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

  const transfer = useMutation({
    mutationFn: () =>
      transferParcel(warehouseId!, {
        trackingNumber: selected!.package.trackingNumber,
        destinationWarehouseId: transferDest,
      }),
    onSuccess: () => {
      toast.success('Parcel transferred');
      setSelected(null);
      setTransferDest('');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Warehouse flow"
            icon={Boxes}
            title="Inventory"
            description="Sort parcels onto shelves, map every storage position, and dispatch outbound loads from a cleaner logistics command view."
            stats={[
              { label: 'Shelfing', value: 'Structured' },
              { label: 'Dispatch', value: 'One click' },
              { label: 'Zone mode', value: 'Live ops' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {STATES.map((s) => (
            <FilterChip
              key={s.key}
              onClick={() => {
                setState(s.key);
                setPage(1);
              }}
              active={state === s.key}
            >
              {s.label}
            </FilterChip>
          ))}
        </div>
        <SearchField
          placeholder="Search tracking / barcode"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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
            <EmptyPanel
              icon={Boxes}
              title="No parcels here"
              description="Receive parcels to build up inventory."
            />
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const m = PACKAGE_STATUS_META[item.package.status] ?? { label: item.package.status, variant: 'secondary' as const };
                const dispatched = !!item.dispatchedAt;
                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm transition-colors hover:bg-white/5">
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-white">{item.package.trackingNumber}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> {item.package.order.dropoffAddress?.city ?? '—'} ·{' '}
                        {item.package.order.orderNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.shelfCode ? (
                        <Badge variant="outline" className="gap-1 border-white/10 text-slate-200">
                          <Tag className="h-3 w-3" /> {item.shelfCode}
                          {item.zone ? ` · ${item.zone}` : ''}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">No shelf</span>
                      )}
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    {!dispatched && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openSort(item)}>
                          <Tag className="h-4 w-4" /> Sort
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            printWarehouseLabel(
                              item.package.trackingNumber,
                              item.shelfCode,
                              item.package.order.dropoffAddress?.city,
                            )
                          }
                        >
                          <Printer className="h-4 w-4" /> Label
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
          <p className="text-sm text-slate-400">
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
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> Cross-warehouse transfer
                </p>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                >
                  <option value="">— Destination warehouse —</option>
                  {warehouses?.filter((w) => w.id !== warehouseId).map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => transfer.mutate()}
                  disabled={!transferDest || transfer.isPending}
                >
                  {transfer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                  Transfer parcel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
