'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { listPermissions } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

export function AdminPermissions() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-permissions', page],
    queryFn: () => listPermissions({ page, limit: 15 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero eyebrow="Fine-grained access" icon={KeyRound} title="Permissions" description="Resource.action keys assigned to roles." stats={[]} />
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No permissions" description="Permission catalog is empty." icon={KeyRound} />
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <p className="font-mono text-sm font-semibold text-foreground">{p.key}</p>
                <p className="text-xs text-muted-foreground">{p.resource}.{p.action}</p>
                {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
              </CardContent>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
