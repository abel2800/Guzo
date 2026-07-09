'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, MapPin, Weight, Loader2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { listAvailableJobs, acceptOrder } from '@/lib/ops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function DriverAvailable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-available', page],
    queryFn: () => listAvailableJobs({ page, limit: 10 }),
    refetchInterval: 20_000,
  });

  const accept = useMutation({
    mutationFn: (id: string) => acceptOrder(id),
    onMutate: (id) => setAcceptingId(id),
    onSuccess: () => {
      toast.success('Job accepted — check My Deliveries');
      queryClient.invalidateQueries({ queryKey: ['driver-available'] });
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setAcceptingId(null),
  });

  const jobs = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Driver dispatch feed"
        icon={Package}
        title="Available Jobs"
        description="Confirmed shipments waiting for a driver. Claim a route, start the mission, and move straight into live delivery mode."
        stats={[
          { label: 'Feed', value: 'Realtime' },
          { label: 'Refresh', value: '20s sync' },
          { label: 'Mode', value: 'Accept & go' },
        ]}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyPanel
              icon={Inbox}
              title="No jobs available right now"
              description="New confirmed orders will appear here automatically."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((o) => (
            <Card key={o.id} className="overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="dashboard-orb -right-8 top-2 h-20 w-20 bg-guzo-primary/10" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-guzo-primary/15 text-guzo-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{o.orderNumber}</p>
                      <p className="text-xs text-slate-400">{o.deliveryType}</p>
                    </div>
                  </div>
                  <Badge className="border-white/10 bg-white/10 text-white">{o.currency} {o.totalAmount}</Badge>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 text-slate-200">
                    <MapPin className="h-4 w-4 text-emerald-600" /> {o.pickupAddress?.city} · {o.pickupAddress?.line1}
                  </p>
                  <p className="flex items-center gap-2 text-slate-200">
                    <MapPin className="h-4 w-4 text-orange-600" /> {o.dropoffAddress?.city} · {o.dropoffAddress?.line1}
                  </p>
                  {o.distanceKm != null && (
                    <p className="flex items-center gap-2 text-slate-400">
                      <Weight className="h-4 w-4" /> {o.packages?.[0]?.weightKg ?? '—'} kg · {o.distanceKm} km
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => accept.mutate(o.id)}
                  disabled={accept.isPending && acceptingId === o.id}
                >
                  {accept.isPending && acceptingId === o.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Accept job'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
