'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createVehicle, listVehicles } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';
import { useState } from 'react';

export function AdminVehicles() {
  const qc = useQueryClient();
  const [plate, setPlate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => listVehicles({ limit: 30 }),
  });

  const createMut = useMutation({
    mutationFn: () => createVehicle({ plateNumber: plate, type: 'MOTORCYCLE', status: 'ACTIVE' }),
    onSuccess: () => {
      toast.success('Vehicle added');
      qc.invalidateQueries({ queryKey: ['admin-vehicles'] });
      setPlate('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero eyebrow="Fleet" icon={Car} title="Vehicles" description="Registered fleet plates and assignment status." stats={[]} />
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1"><Label>Plate number</Label><Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="AA-12345" /></div>
          <Button disabled={createMut.isPending || !plate} onClick={() => createMut.mutate()}>
            {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add vehicle
          </Button>
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No vehicles" description="Fleet records appear here." icon={Car} />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-mono font-semibold text-foreground">{v.plateNumber}</p>
                  <p className="text-sm text-muted-foreground">{v.type} {v.brand ? `· ${v.brand}` : ''}</p>
                </div>
                <Badge>{v.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
