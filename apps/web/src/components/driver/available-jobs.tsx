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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Available Jobs</h1>
        <p className="text-muted-foreground">Confirmed shipments waiting for a driver. Accept one to start.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
            <Inbox className="h-10 w-10" />
            <p className="font-semibold text-foreground">No jobs available right now</p>
            <p className="text-sm">New confirmed orders will appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((o) => (
            <Card key={o.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{o.deliveryType}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{o.currency} {o.totalAmount}</Badge>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" /> {o.pickupAddress?.city} · {o.pickupAddress?.line1}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" /> {o.dropoffAddress?.city} · {o.dropoffAddress?.line1}
                  </p>
                  {o.distanceKm != null && (
                    <p className="flex items-center gap-2 text-muted-foreground">
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
