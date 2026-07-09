'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, Package, Loader2, Lock, ArrowRight, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import {
  listManifests,
  createManifest,
  scanManifestParcel,
  departManifest,
  arriveManifest,
  unloadManifestParcel,
  getManifest,
  type ManifestSummary,
} from '@/lib/manifests';
import { listWarehouses } from '@/lib/warehouse';
import { WarehouseSelect, useSelectedWarehouse } from './warehouse-select';
import { BarcodeScanner } from './barcode-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
  DRAFT: 'outline',
  SEALED: 'secondary',
  IN_TRANSIT: 'default',
  ARRIVED: 'secondary',
  UNLOADED: 'success',
};

export function WarehouseManifests() {
  const warehouseId = useSelectedWarehouse();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'outbound' | 'inbound'>('outbound');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [scanCode, setScanCode] = useState('');

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses });
  const { data: manifests, isLoading } = useQuery({
    queryKey: ['manifests', warehouseId, tab],
    queryFn: () => listManifests(warehouseId!, tab),
    enabled: !!warehouseId,
  });

  const { data: detail } = useQuery({
    queryKey: ['manifest', selectedId],
    queryFn: () => getManifest(selectedId!),
    enabled: !!selectedId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['manifests'] });
    queryClient.invalidateQueries({ queryKey: ['manifest'] });
    queryClient.invalidateQueries({ queryKey: ['wh-inventory'] });
  };

  const create = useMutation({
    mutationFn: () => createManifest({ originWarehouseId: warehouseId!, destinationWarehouseId: destWarehouseId || undefined }),
    onSuccess: (m) => {
      toast.success(`Manifest ${m.manifestNumber} created`);
      setSelectedId(m.id);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scan = useMutation({
    mutationFn: () => scanManifestParcel(selectedId!, { trackingNumber: scanCode.trim() }),
    onSuccess: () => {
      toast.success('Parcel added to manifest');
      setScanCode('');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const depart = useMutation({
    mutationFn: () => departManifest(selectedId!, sealNumber.trim()),
    onSuccess: () => {
      toast.success('Truck departed — parcels marked in transit');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const arrive = useMutation({
    mutationFn: () => arriveManifest(selectedId!),
    onSuccess: () => {
      toast.success('Truck marked arrived');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unload = useMutation({
    mutationFn: () => unloadManifestParcel(selectedId!, scanCode.trim()),
    onSuccess: (r) => {
      toast.success(r.complete ? 'All parcels verified — unload complete' : `Unloaded (${r.unloaded}/${r.expected})`);
      setScanCode('');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active: ManifestSummary | undefined = detail ?? manifests?.find((m) => m.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Truck manifests"
            icon={Truck}
            title="Outbound & inbound trucks"
            description="Build manifests, seal trucks, verify unload at destination warehouses."
            stats={[
              { label: 'Create', value: 'Draft' },
              { label: 'Depart', value: 'Seal' },
              { label: 'Receive', value: 'Scan-all' },
            ]}
          />
        </div>
        <WarehouseSelect />
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'outbound' ? 'default' : 'outline'} size="sm" onClick={() => setTab('outbound')}>Outbound</Button>
        <Button variant={tab === 'inbound' ? 'default' : 'outline'} size="sm" onClick={() => setTab('inbound')}>Inbound</Button>
      </div>

      {!warehouseId ? (
        <EmptyPanel icon={Warehouse} title="Select a warehouse" description="Choose a warehouse to manage truck manifests." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Manifests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tab === 'outbound' && (
                <div className="space-y-3 rounded-lg border p-3">
                  <Label>Destination warehouse (optional)</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={destWarehouseId}
                    onChange={(e) => setDestWarehouseId(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {warehouses?.filter((w) => w.id !== warehouseId).map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                    ))}
                  </select>
                  <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    New manifest
                  </Button>
                </div>
              )}
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : !manifests?.length ? (
                <EmptyPanel icon={Truck} title="No manifests" description="Create an outbound manifest to load a truck." />
              ) : (
                <div className="space-y-2">
                  {manifests.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition hover:bg-muted/50 ${selectedId === m.id ? 'border-primary' : ''}`}
                    >
                      <div>
                        <p className="font-medium">{m.manifestNumber}</p>
                        <p className="text-muted-foreground">{m.parcelCount ?? 0} parcels</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[m.status] ?? 'outline'}>{m.status.replace('_', ' ')}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> {active ? active.manifestNumber : 'Select manifest'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!active ? (
                <EmptyPanel icon={Package} title="No manifest selected" description="Pick a manifest from the list." />
              ) : (
                <>
                  {detail?.unloadStatus && (
                    <div className="rounded-lg border p-3 text-sm">
                      <p>Unload progress: {detail.unloadStatus.unloaded}/{detail.unloadStatus.expected}</p>
                      {detail.unloadStatus.missing.length > 0 && (
                        <p className="mt-1 text-destructive">Missing: {detail.unloadStatus.missing.join(', ')}</p>
                      )}
                    </div>
                  )}
                  {detail?.parcels && (
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                      {detail.parcels.map((p) => (
                        <li key={p.id} className="flex justify-between font-mono">
                          <span>{p.trackingNumber}</span>
                          {p.unloadedAt && <Badge variant="success">Unloaded</Badge>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {['DRAFT', 'SEALED'].includes(active.status) && tab === 'outbound' && (
                    <>
                      <BarcodeScanner value={scanCode} onChange={setScanCode} onScan={() => scan.mutate()} autoSubmit />
                      <Button onClick={() => scan.mutate()} disabled={!scanCode.trim() || scan.isPending}>Add parcel</Button>
                      <div className="flex gap-2">
                        <Input placeholder="Seal number" value={sealNumber} onChange={(e) => setSealNumber(e.target.value)} />
                        <Button onClick={() => depart.mutate()} disabled={!sealNumber.trim() || depart.isPending}>
                          <Lock className="mr-2 h-4 w-4" /> Depart
                        </Button>
                      </div>
                    </>
                  )}

                  {['IN_TRANSIT', 'ARRIVED'].includes(active.status) && tab === 'inbound' && (
                    <>
                      {active.status === 'IN_TRANSIT' && (
                        <Button onClick={() => arrive.mutate()} disabled={arrive.isPending}>
                          <ArrowRight className="mr-2 h-4 w-4" /> Mark arrived
                        </Button>
                      )}
                      <BarcodeScanner value={scanCode} onChange={setScanCode} onScan={() => unload.mutate()} autoSubmit />
                      <Button onClick={() => unload.mutate()} disabled={!scanCode.trim() || unload.isPending}>
                        Verify unload scan
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
