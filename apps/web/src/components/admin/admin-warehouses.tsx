'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Warehouse, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createWarehouse, listWarehouses, updateWarehouse } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function AdminWarehouses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', line1: '', city: '', capacity: '500' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-warehouses'],
    queryFn: () => listWarehouses({ limit: 50 }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createWarehouse({
        code: form.code,
        name: form.name,
        line1: form.line1,
        city: form.city,
        capacity: Number(form.capacity) || 0,
      }),
    onSuccess: () => {
      toast.success('Warehouse created');
      qc.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setOpen(false);
      setForm({ code: '', name: '', line1: '', city: '', capacity: '500' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateWarehouse(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-warehouses'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FuturisticHero
          eyebrow="Network nodes"
          icon={Warehouse}
          title="Warehouses"
          description="Hub capacity, locations, and activation status for the WMS network."
          stats={[{ label: 'WMS', value: 'Connected' }]}
        />
        <Button onClick={() => setOpen(true)}>Add warehouse</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No warehouses" description="Create your first warehouse hub." icon={Warehouse} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-foreground">{w.name}</p>
                  <p className="text-sm font-mono text-muted-foreground">{w.code}</p>
                  <p className="text-sm text-muted-foreground">{w.city} · cap {w.capacity}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={w.isActive ? 'success' : 'secondary'}>{w.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggleMut.isPending}
                    onClick={() => toggleMut.mutate({ id: w.id, isActive: !w.isActive })}
                  >
                    {w.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle>New warehouse</SheetTitle>
          <div className="mt-6 space-y-4">
            {(['code', 'name', 'line1', 'city', 'capacity'] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label>{field}</Label>
                <Input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <Button className="w-full" disabled={createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
