'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Truck, Loader2, MapPin, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { dispatchParcel, listInventory, type InventoryItem } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { BarcodeScanner } from './barcode-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function WarehouseDispatch() {
  const warehouseId = useSelectedWarehouse();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data } = useQuery({
    queryKey: ['wh-inventory', warehouseId, 'dispatched', '', 1],
    queryFn: () => listInventory(warehouseId!, { state: 'dispatched', page: 1, limit: 15 }),
    enabled: !!warehouseId,
  });
  const dispatched: InventoryItem[] = data?.items ?? [];

  const dispatch = useMutation({
    mutationFn: (overrideTracking?: string) =>
      dispatchParcel(warehouseId!, { trackingNumber: (overrideTracking ?? trackingNumber).trim() }),
    onSuccess: (item) => {
      toast.success(`Dispatched ${item.package.trackingNumber}`);
      setTrackingNumber('');
      queryClient.invalidateQueries({ queryKey: ['wh-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['wh-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) return toast.error('Select a warehouse first');
    if (!trackingNumber.trim()) return toast.error('Scan or enter a tracking number');
    dispatch.mutate(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Warehouse outbound"
            icon={Send}
            title="Dispatch"
            description="Send sorted parcels out for delivery with barcode scanning and live dispatch history."
            stats={[
              { label: 'Scan', value: 'Barcode ready' },
              { label: 'Queue', value: 'Recent list' },
              { label: 'Speed', value: 'One-tap' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" /> Scan to dispatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <BarcodeScanner
                value={trackingNumber}
                onChange={setTrackingNumber}
                onScan={(code) => {
                  if (!warehouseId) return toast.error('Select a warehouse first');
                  dispatch.mutate(code);
                }}
                label="Tracking / barcode"
              />
              <Button type="submit" className="w-full" disabled={dispatch.isPending}>
                {dispatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Dispatch parcel
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently dispatched</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dispatched.length === 0 ? (
              <EmptyPanel icon={Truck} title="No parcels dispatched yet" />
            ) : (
              <div className="max-h-[360px] dashboard-divide overflow-auto">
                {dispatched.map((item) => (
                  <div key={item.id} className="dashboard-list-row flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-white">{item.package.trackingNumber}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> {item.package.order.dropoffAddress?.city ?? '—'} ·{' '}
                        {item.package.order.orderNumber}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {item.dispatchedAt ? new Date(item.dispatchedAt).toLocaleTimeString() : 'Out'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
