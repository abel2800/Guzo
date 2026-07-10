'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, Search, Check, X, Loader2, Star, MapPin, Radio } from 'lucide-react';
import { toast } from 'sonner';
import {
  listDriversPaged,
  approveDriver,
  rejectDriver,
  getDriverAdminDetail,
  DRIVER_APPROVAL_META,
  DRIVER_STATUS_META,
  type AdminDriver,
} from '@/lib/admin';
import { fileUrl } from '@/lib/orders';
import { initials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Map } from '@/components/map';
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
  SearchField,
} from '@/components/dashboard/futuristic-primitives';

const APPROVAL_FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const LIST_KEY = 'admin-drivers';

function driverAvatar(d: AdminDriver) {
  return d.user?.avatarUrl ?? fileUrl(d.user?.avatar?.storageKey);
}

export function AdminDrivers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [LIST_KEY, page, approvalStatus, search],
    queryFn: () =>
      listDriversPaged({ page, limit: 10, approvalStatus: approvalStatus || undefined, search: search || undefined }),
  });

  const drivers = data?.items ?? [];
  const meta = data?.meta;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => approveDriver(id),
    onMutate: (id) => setBusyId(id),
    onSuccess: () => {
      toast.success('Driver approved — they can sign in now');
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
            description="Approve applicants, monitor online status, and track active drivers on the map."
            stats={[
              { label: 'Approval', value: 'Workflow' },
              { label: 'Live GPS', value: 'Tracking' },
              { label: 'Fleet', value: 'Roster' },
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
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-muted-foreground md:grid">
                <div className="col-span-3">Driver</div>
                <div className="col-span-2">Code</div>
                <div className="col-span-2">Fleet status</div>
                <div className="col-span-2">Approval</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>
              {drivers.map((d) => {
                const m = DRIVER_APPROVAL_META[d.approvalStatus] ?? { label: d.approvalStatus, variant: 'secondary' as const };
                const fleet = DRIVER_STATUS_META[d.status ?? 'OFFLINE'] ?? DRIVER_STATUS_META.OFFLINE;
                const name = d.user ? `${d.user.firstName} ${d.user.lastName}` : d.driverCode;
                const busy = busyId === d.id && (approve.isPending || reject.isPending);
                const canApprove = d.approvalStatus !== 'APPROVED';
                const canReject = d.approvalStatus !== 'REJECTED';
                const avatarSrc = driverAvatar(d);
                return (
                  <div
                    key={d.id}
                    className="grid grid-cols-2 items-center gap-4 px-6 py-4 text-sm md:grid-cols-12"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className="flex items-center gap-3 text-left md:col-span-3"
                    >
                      <Avatar className="h-9 w-9">
                        {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
                        <AvatarFallback>{initials(d.user?.firstName ?? d.driverCode, d.user?.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.user?.phone ?? d.user?.email ?? '—'}</p>
                      </div>
                    </button>
                    <div className="hidden font-mono text-xs md:col-span-2 md:block">{d.driverCode}</div>
                    <div className="md:col-span-2">
                      <Badge variant={fleet.variant}>{fleet.label}</Badge>
                      {d.user?.status === 'PENDING' && (
                        <p className="mt-1 text-[10px] text-amber-600">Account pending</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-3">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(d.id)}>
                        Details
                      </Button>
                      {canApprove && (
                        <Button size="sm" disabled={busy} onClick={() => approve.mutate(d.id)}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          <span className="hidden sm:inline">Approve</span>
                        </Button>
                      )}
                      {canReject && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => reject.mutate(d.id)}>
                          <X className="h-4 w-4" />
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

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selectedId && (
            <DriverDetail
              driverId={selectedId}
              onApprove={() => {
                approve.mutate(selectedId);
                setSelectedId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DriverDetail({
  driverId,
  onApprove,
}: {
  driverId: string;
  onApprove: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-driver-detail', driverId],
    queryFn: () => getDriverAdminDetail(driverId),
  });

  if (isLoading || !data) {
    return <Skeleton className="mt-8 h-64 w-full" />;
  }

  const name = data.user ? `${data.user.firstName} ${data.user.lastName}` : data.driverCode;
  const approval = DRIVER_APPROVAL_META[data.approvalStatus] ?? { label: data.approvalStatus, variant: 'secondary' as const };
  const fleet = DRIVER_STATUS_META[data.status ?? 'OFFLINE'] ?? DRIVER_STATUS_META.OFFLINE;
  const avatarSrc = driverAvatar(data);
  const hasLocation = data.currentLat != null && data.currentLng != null;
  const isWorking = data.status === 'ON_DELIVERY' || data.status === 'ONLINE';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
          <AvatarFallback>{initials(data.user?.firstName ?? data.driverCode, data.user?.lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <SheetTitle>{name}</SheetTitle>
          <p className="font-mono text-xs text-muted-foreground">{data.driverCode}</p>
          {data.user?.email && <p className="text-sm text-muted-foreground">{data.user.email}</p>}
          {data.user?.phone && <p className="text-xs text-muted-foreground">{data.user.phone}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={approval.variant}>{approval.label}</Badge>
        <Badge variant={fleet.variant}>
          <Radio className="mr-1 h-3 w-3" />
          {fleet.label}
        </Badge>
        {data.user?.status && (
          <Badge variant={data.user.status === 'ACTIVE' ? 'success' : 'outline'}>
            Account {data.user.status.toLowerCase()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Deliveries</p>
          <p className="text-lg font-semibold">{data.totalDeliveries ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="flex items-center gap-1 text-lg font-semibold">
            {Number(data.rating ?? 0).toFixed(1)}
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </p>
        </div>
      </div>

      {data.activeDeliveries && data.activeDeliveries.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Active jobs</p>
          {data.activeDeliveries.map((job) => (
            <div key={job.id} className="rounded border border-border px-3 py-2 text-sm">
              <span className="font-mono">{job.orderNumber}</span>
              <span className="ml-2 text-muted-foreground">{job.status}</span>
            </div>
          ))}
        </div>
      )}

      {isWorking && hasLocation ? (
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-sm font-medium">
            <MapPin className="h-4 w-4" /> Live location
          </p>
          <div className="h-52 overflow-hidden rounded-lg border border-border">
            <Map
              markers={[
                {
                  lat: data.currentLat!,
                  lng: data.currentLng!,
                  label: name,
                  color: '#22c55e',
                },
              ]}
            />
          </div>
          {data.lastLocationAt && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(data.lastLocationAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {hasLocation
            ? 'Driver is offline — last known location is not shown until they go online.'
            : 'No GPS location recorded yet.'}
        </p>
      )}

      {data.approvalStatus !== 'APPROVED' && (
        <Button className="w-full" onClick={onApprove}>
          Approve driver & activate account
        </Button>
      )}

      {data.approvalStatus === 'APPROVED' && data.user?.status === 'PENDING' && (
        <Button className="w-full" onClick={onApprove}>
          Activate login access
        </Button>
      )}
    </div>
  );
}
