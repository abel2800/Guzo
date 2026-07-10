'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { listCustomers } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

export function AdminCustomers() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page],
    queryFn: () => listCustomers({ page, limit: 10 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Consumer base"
        icon={Users}
        title="Customers"
        description="End-customer accounts with order history and support context."
        stats={[{ label: 'Profiles', value: 'Unified' }]}
      />
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No customers" description="Customer accounts will appear here." icon={Users} />
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <p className="font-semibold text-foreground">
                  {c.user ? `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim() || c.user.email : c.id}
                </p>
                <p className="text-sm text-muted-foreground">{c.user?.email}</p>
                {c.customerCode && <p className="text-xs font-mono text-muted-foreground">{c.customerCode}</p>}
              </CardContent>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
