'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/lib/orders';
import { scanPickup } from '@/lib/ops';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { BarcodeScanner } from '@/components/warehouse/barcode-scanner';
import { SlideToConfirm } from '@/components/ui/slide-to-confirm';

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

function getPosition(): Promise<{ latitude: number; longitude: number } | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(undefined),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}

function pickupHint(order: Order) {
  if (order.pickupMethod === 'DROP_AT_BRANCH') return 'Go to the branch and scan the sticker on the package.';
  if (order.pickupMethod === 'COMPANY_PICKUP') return 'Ask the sender to show the barcode on their phone, then scan it.';
  return 'Scan the package barcode or QR code.';
}

export function PickupScanDialog({ order, open, onOpenChange, onCompleted }: Props) {
  const [scanned, setScanned] = useState('');
  const pkg = order?.packages?.[0];
  const expected = pkg?.trackingNumber ?? '';
  const trackingOk =
    !!scanned &&
    (scanned === expected ||
      scanned === (pkg as { qrCode?: string })?.qrCode ||
      scanned === (pkg as { pickupPin?: string })?.pickupPin ||
      scanned.includes(expected));

  const submit = useMutation({
    mutationFn: async () => {
      if (!order || !scanned) throw new Error('Scan the parcel first');
      const coords = await getPosition();
      return scanPickup(order.id, { reference: scanned, ...coords });
    },
    onSuccess: () => {
      toast.success('Pickup confirmed — receiver can track now');
      setScanned('');
      onCompleted();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" /> Scan pickup
        </SheetTitle>
        {order && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">{order.orderNumber} · {pickupHint(order)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Expected tracking: {expected || '—'}</p>
            <div className="mt-4">
              <BarcodeScanner value={scanned} onChange={setScanned} label="Tracking / QR / PIN" />
            </div>
            {scanned && !trackingOk ? (
              <p className="mt-2 text-sm text-amber-500">Code mismatch — verify the parcel label</p>
            ) : scanned ? (
              <p className="mt-2 text-sm text-emerald-500">Parcel verified</p>
            ) : null}
            {trackingOk && (
              <div className="mt-6">
                <SlideToConfirm
                  label="Slide to confirm pickup"
                  onConfirm={() => { void submit.mutateAsync(); }}
                  loading={submit.isPending}
                  disabled={submit.isPending}
                />
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
