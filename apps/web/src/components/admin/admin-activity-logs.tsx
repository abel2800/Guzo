'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { listActivityLogs } from '@/lib/platform';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

export function AdminActivityLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page],
    queryFn: () => listActivityLogs({ page, limit: 15 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Workforce telemetry"
        icon={Activity}
        title="Activity logs"
        description="Branch, warehouse, and driver actions recorded across the network."
        stats={[]}
      />
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No activity yet" description="Employee actions will appear here." icon={Activity} />
      ) : (
        <div className="space-y-2">
          {items.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-white">{log.action}</p>
                  <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                {log.user?.email && <p className="text-xs text-slate-400">{log.user.email}</p>}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {JSON.stringify(log.metadata)}
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
