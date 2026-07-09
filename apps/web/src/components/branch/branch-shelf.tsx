'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes } from 'lucide-react';
import { toast } from 'sonner';
import {
  assignBranchShelf,
  getMyBranches,
  lookupBranchShelf,
  type BranchInventoryItem,
} from '@/lib/branch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarcodeScanner } from '@/components/warehouse/barcode-scanner';
import { FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function BranchShelf() {
  const qc = useQueryClient();
  const { data: branches = [] } = useQuery({ queryKey: ['branch-me'], queryFn: getMyBranches });
  const [branchId, setBranchId] = useState('');
  const activeBranch = branchId || branches[0]?.branchId || '';
  const [tracking, setTracking] = useState('');
  const [shelfCode, setShelfCode] = useState('');
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResults, setLookupResults] = useState<BranchInventoryItem[]>([]);

  const assign = useMutation({
    mutationFn: () =>
      assignBranchShelf(activeBranch, {
        trackingNumber: tracking.trim(),
        shelfCode: shelfCode.trim(),
      }),
    onSuccess: () => {
      toast.success('Shelf assigned');
      setTracking('');
      qc.invalidateQueries({ queryKey: ['branch-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onLookup() {
    if (!activeBranch || !lookupCode.trim()) return;
    try {
      const items = await lookupBranchShelf(activeBranch, lookupCode.trim());
      setLookupResults(items);
      if (!items.length) toast.message('No parcels on this shelf');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lookup failed');
    }
  }

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Storage"
        icon={Boxes}
        title="Shelf management"
        description="Assign parcels to shelf locations and look up what is stored where."
        stats={[
          { label: 'Assign', value: 'Scan' },
          { label: 'Lookup', value: 'By code' },
          { label: 'Branch', value: branches.find((b) => b.branchId === activeBranch)?.branch?.code ?? '—' },
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
            <h2 className="font-semibold text-white">Assign shelf</h2>
            <BarcodeScanner value={tracking} onChange={setTracking} label="Tracking number" />
            <div className="space-y-2">
              <Label>Shelf code</Label>
              <Input value={shelfCode} onChange={(e) => setShelfCode(e.target.value)} placeholder="B-12" />
            </div>
            <Button className="w-full" disabled={!tracking || !shelfCode || !activeBranch || assign.isPending} onClick={() => assign.mutate()}>
              Save shelf
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold text-white">Shelf lookup</h2>
            <div className="space-y-2">
              <Label>Shelf code</Label>
              <Input value={lookupCode} onChange={(e) => setLookupCode(e.target.value)} placeholder="B-12" />
            </div>
            <Button className="w-full" variant="outline" disabled={!lookupCode || !activeBranch} onClick={onLookup}>
              Find parcels
            </Button>
            <div className="space-y-2">
              {lookupResults.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  <p className="font-mono font-semibold">{item.package?.trackingNumber}</p>
                  <p className="text-muted-foreground">
                    {item.package?.order?.orderNumber} · {item.package?.order?.status}
                  </p>
                  <p className="text-muted-foreground">{item.package?.order?.dropoffAddress?.city}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
