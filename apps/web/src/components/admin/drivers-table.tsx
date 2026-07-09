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
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
  SearchField,
} from '@/components/dashboard/futuristic-primitives';

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
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Fleet operations"
            icon={Truck}
            title="Drivers"
            description="Approve applicants, monitor fleet performance, and keep your delivery network mission-ready."
            stats={[
              { label: 'Approval', value: 'Workflow' },
              { label: 'Rating', value: 'Performance' },
              { label: 'Fleet', value: 'Live roster' },
            ]}
          />
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          <SearchField
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
          <FilterChip
            key={s || 'all'}
            onClick={() => {
              setApprovalStatus(s);
              setPage(1);
            }}
            active={approvalStatus === s}
          >
            {s ? DRIVER_APPROVAL_META[s]?.label ?? s : 'All'}
          </FilterChip>
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
            <EmptyPanel icon={Truck} title="No drivers found" />
          ) : (
            <div className="dashboard-divide">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-slate-400 md:grid">
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
                        <p className="truncate text-xs text-slate-400">{d.user?.phone ?? d.user?.email ?? '—'}</p>
                      </div>
                    </div>
                    <div className="hidden font-mono text-xs md:col-span-2 md:block">{d.driverCode}</div>
                    <div className="hidden items-center gap-1 md:col-span-2 md:flex">
                      {d.totalDeliveries ?? 0}
                      {d.rating != null && Number(d.rating) > 0 && (
                        <span className="ml-2 flex items-center gap-0.5 text-xs text-slate-400">
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

      {meta && (
        <PaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="drivers"
          hasPrev={meta.hasPrev}
          hasNext={meta.hasNext}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
