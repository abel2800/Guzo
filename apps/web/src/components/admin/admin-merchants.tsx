'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes } from 'lucide-react';
import { listMerchants } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

export function AdminMerchants() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-merchants', page],
    queryFn: () => listMerchants({ page, limit: 10 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Partner network"
        icon={Boxes}
        title="Merchants"
        description="Registered merchant accounts and business profiles across the platform."
        stats={[{ label: 'Scope', value: 'B2B' }, { label: 'API', value: 'Live' }]}
      />
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No merchants" description="Merchant accounts will appear here." icon={Boxes} />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-white">{m.businessName}</p>
                  <p className="text-sm text-muted-foreground font-mono">{m.merchantCode}</p>
                  {m.user?.email && <p className="text-xs text-slate-400">{m.user.email}</p>}
                </div>
                <Badge variant={m.isActive === false ? 'secondary' : 'success'}>
                  {m.isActive === false ? 'Inactive' : 'Active'}
                </Badge>
              </CardContent>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
