'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { assignBranchStaff, createBranch, listBranches, listBranchStaff, updateBranch } from '@/lib/admin-platform';
import { listUsers } from '@/lib/admin';
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
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', line1: '', city: '', phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: () => listBranches(true),
  });

  const { data: staffSearchResults } = useQuery({
    queryKey: ['admin-users-branch-assign', staffSearch],
    queryFn: () => listUsers({ search: staffSearch, limit: 8 }),
    enabled: assignOpen != null && staffSearch.trim().length >= 2,
  });

  const { data: branchStaff } = useQuery({
    queryKey: ['branch-staff', assignOpen],
    queryFn: () => listBranchStaff(assignOpen!),
    enabled: !!assignOpen,
  });

  const createMut = useMutation({
    mutationFn: () => createBranch(form),
    onSuccess: () => {
      toast.success('Branch created — it is now available to customers, drivers, and branch staff');
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

  const assignMut = useMutation({
    mutationFn: ({ userId, branchId }: { userId: string; branchId: string }) => assignBranchStaff(userId, branchId),
    onSuccess: () => {
      toast.success('Staff assigned to branch');
      qc.invalidateQueries({ queryKey: ['branch-staff', assignOpen] });
      setStaffSearch('');
    },
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
          description="Create pickup points. New branches appear for customers booking, drivers handing off, and branch staff after assignment."
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
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <p className="text-sm font-mono text-muted-foreground">{b.code}</p>
                    <p className="text-sm text-muted-foreground">{b.city} · {b.line1}</p>
                    {b.phone && <p className="text-xs text-muted-foreground">{b.phone}</p>}
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
                </div>
                <Button size="sm" variant="secondary" onClick={() => setAssignOpen(b.id)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign staff
                </Button>
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
              Create branch
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!assignOpen} onOpenChange={(v) => !v && setAssignOpen(null)}>
        <SheetContent>
          <SheetTitle>Assign branch staff</SheetTitle>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Search user by email or name</Label>
              <Input value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} placeholder="branch.staff@…" />
            </div>
            <div className="space-y-2">
              {(staffSearchResults?.items ?? []).map((u) => (
                <Button
                  key={u.id}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={assignMut.isPending}
                  onClick={() => assignMut.mutate({ userId: u.id, branchId: assignOpen! })}
                >
                  {u.firstName} {u.lastName} · {u.email}
                </Button>
              ))}
            </div>
            {branchStaff && branchStaff.length > 0 ? (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Already assigned</p>
                {branchStaff.map((s) => (
                  <p key={`${s.userId}-${s.branchId}`} className="text-sm text-muted-foreground">
                    User {s.userId.slice(0, 8)}… · since {new Date(s.assignedAt).toLocaleDateString()}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
