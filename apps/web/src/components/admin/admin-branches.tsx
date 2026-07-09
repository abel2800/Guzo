'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBranch, listBranches, updateBranch } from '@/lib/admin-platform';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function AdminBranches() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', line1: '', city: '', phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => listBranches(true),
  });

  const createMut = useMutation({
    mutationFn: () => createBranch(form),
    onSuccess: () => {
      toast.success('Branch created');
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      setOpen(false);
      setForm({ code: '', name: '', line1: '', city: '', phone: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateBranch(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-branches'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FuturisticHero
          eyebrow="Last-mile network"
          icon={MapPin}
          title="Branches"
          description="Pickup points, counter operations, and city coverage for Guzo branches."
          stats={[{ label: 'CRUD', value: 'Admin' }]}
        />
        <Button onClick={() => setOpen(true)}>Add branch</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <EmptyPanel title="No branches" description="Create a branch pickup point." icon={MapPin} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-white">{b.name}</p>
                  <p className="text-sm font-mono text-muted-foreground">{b.code}</p>
                  <p className="text-sm text-slate-400">{b.city} · {b.line1}</p>
                  {b.phone && <p className="text-xs text-slate-500">{b.phone}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={b.isActive ? 'success' : 'secondary'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggleMut.isPending}
                    onClick={() => toggleMut.mutate({ id: b.id, isActive: !b.isActive })}
                  >
                    {b.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetTitle>New branch</SheetTitle>
          <div className="mt-6 space-y-4">
            {(['code', 'name', 'line1', 'city', 'phone'] as const).map((field) => (
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
