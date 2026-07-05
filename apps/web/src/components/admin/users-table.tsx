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
  USER_STATUS_META,
  type AdminUser,
  type UserStatus,
} from '@/lib/admin';
import { initials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

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
  const selected = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: [LIST_KEY] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage accounts, roles and access across the platform.</p>
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
          <button
            key={s || 'all'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              status === s ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {s ? USER_STATUS_META[s]?.label ?? s : 'All'}
          </button>
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
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No users found</p>
            </div>
          ) : (
            <div className="divide-y">
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
                    className="grid w-full grid-cols-2 items-center gap-4 px-6 py-4 text-left text-sm transition-colors hover:bg-muted/50 md:grid-cols-12"
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
                          <span key={r} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} users
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

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <UserDetail
              user={selected}
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
  user,
  onChanged,
  onDeleted,
}: {
  user: AdminUser;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const m = USER_STATUS_META[user.status] ?? { label: user.status, variant: 'secondary' as const };
  const [roles, setRoles] = useState<string[]>(user.roles);

  useEffect(() => setRoles(user.roles), [user.id, user.roles]);

  const { data: allRoles } = useQuery({ queryKey: ['roles'], queryFn: listRoles });

  const statusMut = useMutation({
    mutationFn: (s: UserStatus) => updateUserStatus(user.id, s),
    onSuccess: () => {
      toast.success('Status updated');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolesMut = useMutation({
    mutationFn: () => assignUserRoles(user.id, roles),
    onSuccess: () => {
      toast.success('Roles updated');
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => {
      toast.success('User deleted');
      onDeleted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRole = (name: string) =>
    setRoles((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]));

  const rolesDirty = useMemo(
    () => roles.slice().sort().join(',') !== user.roles.slice().sort().join(','),
    [roles, user.roles],
  );

  const STATUS_ACTIONS: { status: UserStatus; label: string; variant: 'default' | 'outline' | 'destructive' }[] = [
    { status: 'ACTIVE', label: 'Activate', variant: 'default' },
    { status: 'SUSPENDED', label: 'Suspend', variant: 'outline' },
    { status: 'BANNED', label: 'Ban', variant: 'destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
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
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.name)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {r.name}
              </button>
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
