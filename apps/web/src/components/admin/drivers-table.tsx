'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, Search, Check, X, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  listDriversPaged,
  approveDriver,
  rejectDriver,
  DRIVER_APPROVAL_META,
} from '@/lib/admin';
import { initials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const APPROVAL_FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const LIST_KEY = 'admin-drivers';

export function AdminDrivers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [LIST_KEY, page, approvalStatus, search],
    queryFn: () =>
      listDriversPaged({ page, limit: 10, approvalStatus: approvalStatus || undefined, search: search || undefined }),
  });

  const drivers = data?.items ?? [];
  const meta = data?.meta;
  const refresh = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] });

  const approve = useMutation({
    mutationFn: (id: string) => approveDriver(id),
    onMutate: (id) => setBusyId(id),
    onSuccess: () => {
      toast.success('Driver approved');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusyId(null),
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectDriver(id),
    onMutate: (id) => setBusyId(id),
    onSuccess: () => {
      toast.success('Driver rejected');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusyId(null),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground">Approve applicants and manage your delivery fleet.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <Input
            placeholder="Search driver code"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-52"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {APPROVAL_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => {
              setApprovalStatus(s);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              approvalStatus === s ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {s ? DRIVER_APPROVAL_META[s]?.label ?? s : 'All'}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Truck className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No drivers found</p>
            </div>
          ) : (
            <div className="divide-y">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-muted-foreground md:grid">
                <div className="col-span-4">Driver</div>
                <div className="col-span-2">Code</div>
                <div className="col-span-2">Deliveries</div>
                <div className="col-span-2">Approval</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {drivers.map((d) => {
                const m = DRIVER_APPROVAL_META[d.approvalStatus] ?? { label: d.approvalStatus, variant: 'secondary' as const };
                const name = d.user ? `${d.user.firstName} ${d.user.lastName}` : d.driverCode;
                const busy = busyId === d.id && (approve.isPending || reject.isPending);
                const canApprove = d.approvalStatus !== 'APPROVED';
                const canReject = d.approvalStatus !== 'REJECTED';
                return (
                  <div
                    key={d.id}
                    className="grid grid-cols-2 items-center gap-4 px-6 py-4 text-sm md:grid-cols-12"
                  >
                    <div className="flex items-center gap-3 md:col-span-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(d.user?.firstName ?? d.driverCode, d.user?.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.user?.phone ?? d.user?.email ?? '—'}</p>
                      </div>
                    </div>
                    <div className="hidden font-mono text-xs md:col-span-2 md:block">{d.driverCode}</div>
                    <div className="hidden items-center gap-1 md:col-span-2 md:flex">
                      {d.totalDeliveries ?? 0}
                      {d.rating != null && Number(d.rating) > 0 && (
                        <span className="ml-2 flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(d.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      {canApprove && (
                        <Button size="sm" disabled={busy} onClick={() => approve.mutate(d.id)}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          <span className="hidden sm:inline">Approve</span>
                        </Button>
                      )}
                      {canReject && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => reject.mutate(d.id)}>
                          <X className="h-4 w-4" />
                          <span className="hidden sm:inline">Reject</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} drivers
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
