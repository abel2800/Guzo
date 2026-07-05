'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScanLine, PackageCheck, Loader2, MapPin, Boxes, Inbox, Send } from 'lucide-react';
import { toast } from 'sonner';
import { receiveParcel, getWarehouseStats, type InventoryItem } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
    mutationFn: () => receiveParcel(warehouseId!, { trackingNumber: trackingNumber.trim(), shelfCode: shelfCode || undefined, zone: zone || undefined }),
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
    receive.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receiving</h1>
          <p className="text-muted-foreground">Scan incoming parcels into the warehouse.</p>
        </div>
        <WarehouseSelect />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="In stock" value={stats?.totals.inStock ?? 0} icon={Boxes} />
        <StatCard label="Received today" value={stats?.totals.receivedToday ?? 0} icon={Inbox} />
        <StatCard label="Dispatched today" value={stats?.totals.dispatchedToday ?? 0} icon={Send} />
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
              <div className="space-y-1.5">
                <Label htmlFor="trk">Tracking / barcode</Label>
                <Input
                  id="trk"
                  autoFocus
                  placeholder="TRK-XXXXXXXX"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
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
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8" />
                Scanned parcels appear here.
              </div>
            ) : (
              <div className="max-h-[360px] divide-y overflow-auto">
                {received.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-semibold">{item.package.trackingNumber}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {item.package.order.dropoffAddress?.city ?? '—'} ·{' '}
                        {item.package.order.orderNumber}
                      </p>
                    </div>
                    <Badge variant="default">{item.shelfCode ? `Shelf ${item.shelfCode}` : 'Received'}</Badge>
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
