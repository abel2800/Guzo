'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listWarehouses, transferParcel } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { BarcodeScanner } from './barcode-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmptyPanel, FuturisticHero, PanelSelect } from '@/components/dashboard/futuristic-primitives';

export function WarehouseTransfer() {
  const warehouseId = useSelectedWarehouse();
  const queryClient = useQueryClient();
  const [tracking, setTracking] = useState('');
  const [destId, setDestId] = useState('');

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });

  const transfer = useMutation({
    mutationFn: () =>
      transferParcel(warehouseId!, {
        trackingNumber: tracking.trim(),
        destinationWarehouseId: destId,
      }),
    onSuccess: (item) => {
      toast.success(`Transferred ${item.package.trackingNumber}`);
      setTracking('');
      queryClient.invalidateQueries({ queryKey: ['wh-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['wh-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Cross-dock"
            icon={ArrowRightLeft}
            title="Warehouse transfer"
            description="Move in-stock parcels between Guzo warehouses without leaving the network."
            stats={[
              { label: 'Scan', value: 'Barcode' },
              { label: 'Stock', value: 'In-place' },
              { label: 'Receive', value: 'Auto at dest' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      {!warehouseId ? (
        <EmptyPanel icon={ArrowRightLeft} title="Select a warehouse" description="Choose the origin warehouse for the transfer." />
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-4 w-4" /> Transfer parcel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarcodeScanner
              value={tracking}
              onChange={setTracking}
              label="Tracking / barcode"
            />
            <div className="space-y-2">
              <Label>Destination warehouse</Label>
              <PanelSelect value={destId} onChange={(e) => setDestId(e.target.value)}>
                <option value="">— Select destination —</option>
                {warehouses?.filter((w) => w.id !== warehouseId).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.city})
                  </option>
                ))}
              </PanelSelect>
            </div>
            <Button
              className="w-full"
              disabled={!tracking.trim() || !destId || transfer.isPending}
              onClick={() => transfer.mutate()}
            >
              {transfer.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Transfer parcel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
