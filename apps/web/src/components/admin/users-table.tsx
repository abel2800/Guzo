'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  listUsers,
  listRoles,
  updateUserStatus,
  assignUserRoles,
  deleteUser,
  approveUserAccount,
  getUserAdminDetail,
  USER_STATUS_META,
  DRIVER_STATUS_META,
  type AdminUser,
  type AdminUserDetail,
  type UserStatus,
} from '@/lib/admin';
import { initials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
  SearchField,
} from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'];
const LIST_KEY = 'admin-users';

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [LIST_KEY, page, status, search],
    queryFn: () => listUsers({ page, limit: 10, status: status || undefined, search: search || undefined }),
  });

  const users = data?.items ?? [];
  const meta = data?.meta;
  const refresh = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Access control"
            icon={Users}
            title="Users"
            description="Manage accounts, roles and platform access from a single identity command center."
            stats={[
              { label: 'Roles', value: 'RBAC' },
              { label: 'Status', value: 'Lifecycle' },
              { label: 'Scope', value: 'Platform-wide' },
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
            placeholder="Search name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <FilterChip
            key={s || 'all'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            active={status === s}
          >
            {s ? USER_STATUS_META[s]?.label ?? s : 'All'}
          </FilterChip>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyPanel icon={Users} title="No users found" />
          ) : (
            <div className="dashboard-divide">
              <div className="hidden grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase text-muted-foreground md:grid">
                <div className="col-span-4">User</div>
                <div className="col-span-4">Roles</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Joined</div>
              </div>
              {users.map((u) => {
                const m = USER_STATUS_META[u.status] ?? { label: u.status, variant: 'secondary' as const };
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className="dashboard-list-row grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left text-sm md:grid-cols-12"
                  >
                    <div className="flex items-center gap-3 md:col-span-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(u.firstName, u.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{u.firstName} {u.lastName}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="hidden flex-wrap gap-1 md:col-span-4 md:flex">
                      {u.roles.length ? (
                        u.roles.map((r) => (
                          <span key={r} className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={m.variant}>{m.label}</Badge>
                    </div>
                    <div className="hidden text-right text-xs text-muted-foreground md:col-span-2 md:block">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </button>
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
          unit="users"
          hasPrev={meta.hasPrev}
          hasNext={meta.hasNext}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selectedId && (
            <UserDetail
              userId={selectedId}
              onChanged={refresh}
              onDeleted={() => {
                refresh();
                setSelectedId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UserDetail({
  userId,
  onChanged,
  onDeleted,
}: {
  userId: string;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => getUserAdminDetail(userId),
  });

  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (user) setRoles(user.roles);
  }, [user?.id, user?.roles]);

  const { data: allRoles } = useQuery({ queryKey: ['roles'], queryFn: listRoles });

  const statusMut = useMutation({
    mutationFn: (s: UserStatus) => updateUserStatus(userId, s),
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: () => approveUserAccount(userId),
    onSuccess: () => {
      toast.success('Account approved — user can sign in now');
      refetch();
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolesMut = useMutation({
    mutationFn: () => assignUserRoles(userId, roles),
    onSuccess: () => {
      toast.success('Roles updated');
      refetch();
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted');
      onDeleted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolesDirty = useMemo(
    () => (user ? roles.slice().sort().join(',') !== user.roles.slice().sort().join(',') : false),
    [roles, user],
  );

  if (isLoading || !user) {
    return <Skeleton className="mt-8 h-48 w-full" />;
  }

  const m = USER_STATUS_META[user.status] ?? { label: user.status, variant: 'secondary' as const };

  const toggleRole = (name: string) =>
    setRoles((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]));

  const STATUS_ACTIONS: { status: UserStatus; label: string; variant: 'default' | 'outline' | 'destructive' }[] = [
    { status: 'ACTIVE', label: 'Activate', variant: 'default' },
    { status: 'SUSPENDED', label: 'Suspend', variant: 'outline' },
    { status: 'BANNED', label: 'Ban', variant: 'destructive' },
  ];

  return (
    <UserDetailPanel
      user={user}
      m={m}
      roles={roles}
      allRoles={allRoles ?? []}
      rolesDirty={rolesDirty}
      statusMut={statusMut}
      approveMut={approveMut}
      rolesMut={rolesMut}
      delMut={delMut}
      toggleRole={toggleRole}
      STATUS_ACTIONS={STATUS_ACTIONS}
    />
  );
}

function UserDetailPanel({
  user,
  m,
  roles,
  allRoles,
  rolesDirty,
  statusMut,
  approveMut,
  rolesMut,
  delMut,
  toggleRole,
  STATUS_ACTIONS,
}: {
  user: AdminUserDetail;
  m: { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' };
  roles: string[];
  allRoles: { id: string; name: string }[];
  rolesDirty: boolean;
  statusMut: ReturnType<typeof useMutation<unknown, Error, UserStatus>>;
  approveMut: ReturnType<typeof useMutation<unknown, Error, void>>;
  rolesMut: ReturnType<typeof useMutation<unknown, Error, void>>;
  delMut: ReturnType<typeof useMutation<unknown, Error, void>>;
  toggleRole: (name: string) => void;
  STATUS_ACTIONS: { status: UserStatus; label: string; variant: 'default' | 'outline' | 'destructive' }[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Profile" /> : null}
          <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <SheetTitle>{user.firstName} {user.lastName}</SheetTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <Badge variant={m.variant}>{m.label}</Badge>
      </div>

      {user.status === 'PENDING' && (
        <Button className="w-full" disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>
          {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve account'}
        </Button>
      )}

      {(user.pendingOrders ?? 0) > 0 && (
        <p className="text-sm text-muted-foreground">Pending orders: {user.pendingOrders}</p>
      )}

      {user.driver && (
        <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <p className="font-medium">Driver profile</p>
          <p className="font-mono text-xs">{user.driver.driverCode}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={DRIVER_STATUS_META[user.driver.status]?.variant ?? 'secondary'}>
              {DRIVER_STATUS_META[user.driver.status]?.label ?? user.driver.status}
            </Badge>
            <Badge variant="outline">{user.driver.approvalStatus}</Badge>
          </div>
          <p className="text-muted-foreground">
            {user.driver.totalDeliveries} deliveries · {user.driver.activeDeliveries} active
          </p>
        </div>
      )}

      {user.merchant && (
        <div className="space-y-1 rounded-lg border border-border p-3 text-sm">
          <p className="font-medium">Merchant</p>
          <p>{user.merchant.businessName}</p>
          <p className="font-mono text-xs text-muted-foreground">{user.merchant.merchantCode}</p>
          <p className="text-muted-foreground">{user.merchant.orderCount} orders</p>
        </div>
      )}

      {user.branches && user.branches.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <p className="font-medium">Branch assignments</p>
          {user.branches.map((b) => (
            <div key={b.id} className="flex justify-between gap-2">
              <span>{b.name} ({b.code})</span>
              <span className="text-muted-foreground">{b.pendingInventory} pending items</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Change status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ACTIONS.map((a) => (
            <Button
              key={a.status}
              size="sm"
              variant={a.variant}
              disabled={user.status === a.status || statusMut.isPending}
              onClick={() => statusMut.mutate(a.status)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1 text-sm font-medium">
          <ShieldCheck className="h-4 w-4" /> Roles
        </p>
        <div className="flex flex-wrap gap-2">
          {(allRoles ?? []).map((r) => {
            const active = roles.includes(r.name);
            return (
              <FilterChip key={r.id} type="button" active={active} onClick={() => toggleRole(r.name)}>
                {r.name}
              </FilterChip>
            );
          })}
        </div>
        <Button size="sm" className="mt-1" disabled={!rolesDirty || roles.length === 0 || rolesMut.isPending} onClick={() => rolesMut.mutate()}>
          {rolesMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save roles'}
        </Button>
      </div>

      <div className="border-t pt-4">
        <Button
          variant="destructive"
          size="sm"
          disabled={delMut.isPending}
          onClick={() => {
            if (confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) delMut.mutate();
          }}
        >
          {delMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete user
        </Button>
      </div>
    </div>
  );
}
