'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, Package, QrCode, Camera } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMyBranches,
  getBranchStats,
  receiveAtBranch,
  receiveIntakeAtBranch,
  confirmBranchPickup,
  getParcelLabel,
  type ParcelLabel,
} from '@/lib/branch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarcodeScanner } from '@/components/warehouse/barcode-scanner';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function BranchCounter() {
  const qc = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const { data: branches = [] } = useQuery({ queryKey: ['branch-me'], queryFn: getMyBranches });
  const [branchId, setBranchId] = useState('');
  const activeBranch = branchId || branches[0]?.branchId || '';
  const { data: stats } = useQuery({
    queryKey: ['branch-stats', activeBranch],
    queryFn: () => getBranchStats(activeBranch),
    enabled: !!activeBranch,
  });
  const [tracking, setTracking] = useState('');
  const [shelfCode, setShelfCode] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [intakePhoto, setIntakePhoto] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [pin, setPin] = useState('');
  const [collectCod, setCollectCod] = useState(false);

  const previewRef = reference.trim() || pin.trim();
  const { data: preview } = useQuery({
    queryKey: ['branch-pickup-preview', activeBranch, previewRef],
    queryFn: () => getParcelLabel(activeBranch, reference.trim() || pin.trim()),
    enabled: !!activeBranch && previewRef.length >= 6,
  });

  const receive = useMutation({
    mutationFn: async () => {
      const payload = {
        trackingNumber: tracking.trim(),
        shelfCode: shelfCode || undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      };
      if (intakePhoto) {
        return receiveIntakeAtBranch(activeBranch, { ...payload, photo: intakePhoto });
      }
      return receiveAtBranch(activeBranch, payload);
    },
    onSuccess: (res) => {
      toast.success(`Received ${res.package?.trackingNumber} → ${res.package?.order?.status}`);
      setTracking('');
      setIntakePhoto(null);
      if (photoRef.current) photoRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
      qc.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pickup = useMutation({
    mutationFn: () => {
      if (preview?.requiresCod && !collectCod) {
        throw new Error('Collect COD cash before confirming pickup');
      }
      return confirmBranchPickup(activeBranch, {
        reference: reference.trim() || undefined,
        pin: pin.trim() || undefined,
        collectCod,
      });
    },
    onSuccess: (res) => {
      toast.success(`Pickup complete — ${res.package?.trackingNumber} delivered`);
      setReference('');
      setPin('');
      setCollectCod(false);
      qc.invalidateQueries({ queryKey: ['branch-stats'] });
      qc.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canPickup = (!!reference.trim() || pin.trim().length >= 6) && !!activeBranch;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Branch counter"
        icon={Store}
        title={branches.find((b) => b.branchId === activeBranch)?.branch?.name ?? 'Branch desk'}
        description="Receive inbound parcels (with optional photo) and confirm customer pickups."
        stats={[
          { label: 'In stock', value: String(stats?.totals.inStock ?? 0) },
          { label: 'Outgoing', value: String(stats?.totals.outgoing ?? 0) },
          { label: 'Ready', value: String(stats?.totals.readyForPickup ?? 0) },
          { label: 'Today in', value: String(stats?.totals.incomingToday ?? 0) },
        ]}
      />

      {branches.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <Button key={b.branchId} variant={activeBranch === b.branchId ? 'default' : 'outline'} size="sm" onClick={() => setBranchId(b.branchId)}>
              {b.branch?.name ?? b.branchId}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-guzo-primary">
              <Package className="h-5 w-5" />
              <h2 className="font-semibold text-foreground">Receive</h2>
            </div>
            <BarcodeScanner value={tracking} onChange={setTracking} label="Tracking number" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Shelf (optional)</Label>
                <Input value={shelfCode} onChange={(e) => setShelfCode(e.target.value)} placeholder="A-12" />
              </div>
              <div className="space-y-2">
                <Label>Weight kg</Label>
                <Input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="2.5" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Intake photo (optional)</Label>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-guzo-primary/20 file:px-3 file:py-2 file:text-guzo-primary"
                onChange={(e) => setIntakePhoto(e.target.files?.[0] ?? null)}
              />
              {intakePhoto ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Camera className="h-3 w-3" /> {intakePhoto.name} — will use receive-intake API
                </p>
              ) : null}
            </div>
            <Button className="w-full" disabled={!tracking || !activeBranch || receive.isPending} onClick={() => receive.mutate()}>
              Receive parcel
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-guzo-primary">
              <QrCode className="h-5 w-5" />
              <h2 className="font-semibold text-foreground">Pickup</h2>
            </div>
            <BarcodeScanner value={reference} onChange={setReference} label="Tracking / QR" />
            <div className="space-y-2">
              <Label>Pickup PIN (or PIN-only)</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} placeholder="6-digit PIN" />
            </div>
            {preview ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="font-mono font-semibold">{preview.trackingNumber}</p>
                <p className="text-muted-foreground">Order {preview.orderNumber} · {preview.status}</p>
                {preview.requiresCod ? (
                  <p className="mt-1 font-semibold text-guzo-primary">COD due: ETB {preview.codAmount}</p>
                ) : null}
              </div>
            ) : null}
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <span>{preview?.requiresCod ? `Collect ETB ${preview.codAmount} cash` : 'Collect COD cash'}</span>
              <input
                type="checkbox"
                checked={collectCod}
                onChange={(e) => setCollectCod(e.target.checked)}
                className="h-4 w-4 accent-guzo-primary"
              />
            </label>
            <Button className="w-full" disabled={!canPickup || pickup.isPending} onClick={() => pickup.mutate()}>
              Confirm pickup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
