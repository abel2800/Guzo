'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listDriverManifests,
  getDriverManifest,
  scanDriverManifest,
  departDriverManifest,
  arriveDriverManifest,
  unloadDriverManifest,
} from '@/lib/driver-ops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function DriverManifests() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scanCode, setScanCode] = useState('');

  const { data: manifests, isLoading } = useQuery({
    queryKey: ['driver-manifests'],
    queryFn: listDriverManifests,
    refetchInterval: 20_000,
  });

  const { data: detail } = useQuery({
    queryKey: ['driver-manifest', selectedId],
    queryFn: () => getDriverManifest(selectedId!),
    enabled: !!selectedId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['driver-manifests'] });
    qc.invalidateQueries({ queryKey: ['driver-manifest'] });
  };

  const scan = useMutation({
    mutationFn: () => scanDriverManifest(selectedId!, scanCode.trim()),
    onSuccess: () => { toast.success('Parcel scanned'); setScanCode(''); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const depart = useMutation({
    mutationFn: () => departDriverManifest(selectedId!),
    onSuccess: () => { toast.success('Departed'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const arrive = useMutation({
    mutationFn: () => arriveDriverManifest(selectedId!),
    onSuccess: () => { toast.success('Arrived'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const unload = useMutation({
    mutationFn: () => unloadDriverManifest(selectedId!, scanCode.trim()),
    onSuccess: () => { toast.success('Unloaded'); setScanCode(''); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const canLoad = detail && ['DRAFT', 'SEALED'].includes(detail.status);
  const canDepart = detail?.status === 'SEALED' && (detail.parcelCount ?? 0) > 0;
  const inTransit = detail?.status === 'IN_TRANSIT';
  const arrived = detail?.status === 'ARRIVED';

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Intercity"
        icon={Truck}
        title="Manifests"
        description="Load, depart, arrive, and unload intercity truck manifests assigned to you."
        stats={[
          { label: 'Active', value: String(manifests?.length ?? 0) },
          { label: 'Scan', value: 'Required' },
          { label: 'Unload', value: 'At warehouse' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (manifests?.length ?? 0) === 0 ? (
        <EmptyPanel icon={Truck} title="No manifests" description="Intercity manifests assigned to you will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {manifests!.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full rounded-lg border p-4 text-left ${selectedId === m.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{m.manifestNumber}</span>
                  <Badge variant="outline">{m.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{m.parcelCount} parcels</p>
              </button>
            ))}
          </div>

          {detail && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <p className="font-mono text-lg font-bold text-white">{detail.manifestNumber}</p>
                <Input placeholder="Scan tracking TRK-…" value={scanCode} onChange={(e) => setScanCode(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {canLoad && (
                    <Button size="sm" disabled={!scanCode || scan.isPending} onClick={() => scan.mutate()}>
                      {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                      Load parcel
                    </Button>
                  )}
                  {canDepart && (
                    <Button size="sm" disabled={depart.isPending} onClick={() => depart.mutate()}>Depart</Button>
                  )}
                  {inTransit && (
                    <Button size="sm" disabled={arrive.isPending} onClick={() => arrive.mutate()}>Mark arrived</Button>
                  )}
                  {arrived && (
                    <Button size="sm" disabled={!scanCode || unload.isPending} onClick={() => unload.mutate()}>Unload</Button>
                  )}
                </div>
                {detail.unloadStatus && (
                  <p className="text-sm text-slate-400">
                    Unloaded {detail.unloadStatus.unloaded}/{detail.unloadStatus.expected}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
