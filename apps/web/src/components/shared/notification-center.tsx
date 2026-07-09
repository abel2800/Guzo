'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => listNotifications({ limit: 8 }),
    refetchInterval: 60_000,
  });

  const items = data?.items ?? [];
  const unread = data?.meta?.unreadCount ?? items.filter((n) => !n.readAt).length;

  const readMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-white/10 bg-guzo-bg/95 backdrop-blur-xl">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={readAllMut.isPending}
              onClick={() => readAllMut.mutate()}
            >
              {readAllMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-400">No notifications yet.</p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-1 py-3"
              onClick={() => !n.readAt && readMut.mutate(n.id)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-medium">{n.title}</span>
                {!n.readAt && <Badge variant="default" className="text-[10px]">New</Badge>}
              </div>
              <span className="text-xs text-slate-400 line-clamp-2">{n.body}</span>
              <span className="text-[10px] text-slate-500">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NotificationInbox() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: () => listNotifications({ limit: 50 }),
  });

  const readMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FuturisticHero
          eyebrow="System alerts"
          icon={Bell}
          title="Notifications"
          description="Stay on top of ticket updates, delivery events, and platform alerts in one unified inbox."
          stats={[
            { label: 'Inbox', value: `${items.length} items` },
            { label: 'Sync', value: 'Live feed' },
            { label: 'Scope', value: 'All roles' },
          ]}
        />
        <Button variant="outline" disabled={readAllMut.isPending} onClick={() => readAllMut.mutate()}>
          {readAllMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Mark all read
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyPanel icon={Bell} title="No notifications" description="You're all caught up." />
          ) : (
            <div className="dashboard-divide">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="dashboard-list-row flex w-full flex-col gap-1 px-6 py-4 text-left"
                  onClick={() => !n.readAt && readMut.mutate(n.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{n.title}</span>
                    {!n.readAt && <Badge>New</Badge>}
                  </div>
                  <p className="text-sm text-slate-300">{n.body}</p>
                  <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
