'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScanLine, PackageCheck, Loader2, MapPin, Boxes, Inbox, Send } from 'lucide-react';
import { toast } from 'sonner';
import { receiveParcel, getWarehouseStats, printWarehouseLabel, type InventoryItem } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { BarcodeScanner } from './barcode-scanner';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function WarehouseReceiving() {
  const warehouseId = useSelectedWarehouse();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shelfCode, setShelfCode] = useState('');
  const [zone, setZone] = useState('');
  const [received, setReceived] = useState<InventoryItem[]>([]);

  const { data: stats } = useQuery({
    queryKey: ['wh-stats', warehouseId],
    queryFn: () => getWarehouseStats(warehouseId!),
    enabled: !!warehouseId,
  });

  const receive = useMutation({
    mutationFn: (overrideTracking?: string) =>
      receiveParcel(warehouseId!, {
        trackingNumber: (overrideTracking ?? trackingNumber).trim(),
        shelfCode: shelfCode || undefined,
        zone: zone || undefined,
      }),
    onSuccess: (item) => {
      toast.success(`Received ${item.package.trackingNumber}`);
      setReceived((prev) => [item, ...prev].slice(0, 20));
      setTrackingNumber('');
      queryClient.invalidateQueries({ queryKey: ['wh-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wh-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) return toast.error('Select a warehouse first');
    if (!trackingNumber.trim()) return toast.error('Scan or enter a tracking number');
    receive.mutate(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Warehouse intake"
            icon={ScanLine}
            title="Receiving"
            description="Scan incoming parcels into the warehouse with shelf and zone assignment."
            stats={[
              { label: 'Scan', value: 'Barcode ready' },
              { label: 'Shelf', value: 'Optional' },
              { label: 'Today', value: 'Live count' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="In stock" value={stats?.totals.inStock ?? 0} icon={Boxes} />
        <StatCard label="Received today" value={stats?.totals.receivedToday ?? 0} icon={Inbox} />
        <StatCard label="Dispatched today" value={stats?.totals.dispatchedToday ?? 0} icon={Send} />
        <StatCard label="Capacity" value={`${stats?.totals.capacityPercent ?? 0}%`} icon={Boxes} />
        <StatCard label="Shelf use" value={`${stats?.totals.shelfUtilization ?? 0}%`} icon={MapPin} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" /> Scan parcel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <BarcodeScanner
                value={trackingNumber}
                onChange={setTrackingNumber}
                onScan={(code) => {
                  if (!warehouseId) return toast.error('Select a warehouse first');
                  receive.mutate(code);
                }}
                label="Tracking / barcode"
              />
              <p className="text-xs text-muted-foreground">Leave shelf empty for auto-assign by destination city.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="shelf">Shelf (optional)</Label>
                  <Input id="shelf" placeholder="A-12" value={shelfCode} onChange={(e) => setShelfCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="zone">Zone (optional)</Label>
                  <Input id="zone" placeholder="Zone A" value={zone} onChange={(e) => setZone(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={receive.isPending}>
                {receive.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                Receive parcel
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently received</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {received.length === 0 ? (
              <EmptyPanel icon={Inbox} title="No parcels yet" description="Scanned parcels appear here." />
            ) : (
              <div className="max-h-[360px] dashboard-divide overflow-auto">
                {received.map((item) => (
                  <div key={item.id} className="dashboard-list-row flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-white">{item.package.trackingNumber}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.shelfCode ? `Shelf ${item.shelfCode}` : 'No shelf'}
                        {item.zone ? ` · ${item.zone}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        printWarehouseLabel(
                          item.package.trackingNumber,
                          item.shelfCode,
                          item.package.order?.dropoffAddress?.city,
                        )
                      }
                    >
                      Label
                    </Button>
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
