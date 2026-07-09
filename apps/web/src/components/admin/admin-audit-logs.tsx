'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { listAuditLogs } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

export function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => listAuditLogs({ page, limit: 15 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero eyebrow="Compliance" icon={ScrollText} title="Audit logs" description="Immutable trail of admin mutations and sensitive actions." stats={[]} />
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No audit entries" description="Admin actions will be recorded here." icon={ScrollText} />
      ) : (
        <div className="space-y-2">
          {items.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-white">{log.action}</p>
                  <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-muted-foreground">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</p>
                {log.actor && (
                  <p className="text-xs text-slate-400">
                    {log.actor.firstName} {log.actor.lastName} ({log.actor.email})
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
