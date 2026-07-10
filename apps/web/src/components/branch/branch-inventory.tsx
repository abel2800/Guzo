'use client';

import Link from 'next/link';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, MapPin } from 'lucide-react';
import { listBranchInventory, getMyBranches, type BranchInventoryItem } from '@/lib/branch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, SearchField } from '@/components/dashboard/futuristic-primitives';

export function BranchInventory() {
  const { data: branches = [] } = useQuery({ queryKey: ['branch-me'], queryFn: getMyBranches });
  const [branchId, setBranchId] = useState('');
  const activeBranch = branchId || branches[0]?.branchId || '';
  const [search, setSearch] = useState('');
  const [state, setState] = useState<'in-stock' | 'all'>('in-stock');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-inventory', activeBranch, state],
    queryFn: () => listBranchInventory(activeBranch, { state, limit: 50 }),
    enabled: !!activeBranch,
  });

  const items = (data?.items ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const trk = item.package?.trackingNumber?.toLowerCase() ?? '';
    const city = item.package?.order?.dropoffAddress?.city?.toLowerCase() ?? '';
    return trk.includes(q) || city.includes(q);
  });

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Branch stock"
        icon={Boxes}
        title={branches.find((b) => b.branchId === activeBranch)?.branch?.name ?? 'Branch inventory'}
        description="Parcels currently held at the branch with shelf and destination details."
        stats={[
          { label: 'In view', value: String(items.length) },
          { label: 'Filter', value: state === 'in-stock' ? 'In stock' : 'All' },
          { label: 'Shelf', value: 'Live' },
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

      <div className="flex flex-wrap gap-2">
        <Button variant={state === 'in-stock' ? 'default' : 'outline'} size="sm" onClick={() => setState('in-stock')}>In stock</Button>
        <Button variant={state === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setState('all')}>All</Button>
      </div>

      <SearchField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracking or city" />

      {!activeBranch ? (
        <EmptyPanel icon={Boxes} title="No branch assigned" description="Contact admin to assign you to a branch." />
      ) : isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyPanel icon={Boxes} title="No parcels" description="Received parcels appear here." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryRow({ item }: { item: BranchInventoryItem }) {
  const pkg = item.package;
  const tracking = pkg?.trackingNumber;
  return (
    <Link href={tracking ? `/dashboard/branch/shelf?tracking=${encodeURIComponent(tracking)}` : '/dashboard/branch/shelf'} className="block">
      <Card className="transition-colors hover:border-guzo-primary/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <div>
          <p className="font-mono font-semibold">{pkg?.trackingNumber}</p>
          <p className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {pkg?.order?.dropoffAddress?.city ?? '—'} · {pkg?.order?.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {item.shelfCode ? <Badge variant="outline">Shelf {item.shelfCode}</Badge> : null}
          <Badge variant="secondary">{pkg?.status}</Badge>
        </div>
      </CardContent>
      </Card>
    </Link>
  );
}
