'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LifeBuoy, Search, MessageSquare } from 'lucide-react';
import {
  listTickets,
  TICKET_STATUS_META,
  TICKET_PRIORITY_META,
  TICKET_STATUSES,
} from '@/lib/tickets';
import { TicketThread } from './ticket-thread';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function SupportTickets() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'agent', status, search, page],
    queryFn: () => listTickets({ page, limit: 12, status: status || undefined, search: search || undefined }),
  });

  const tickets = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">Triage and respond to customer tickets.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              status === '' ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            All
          </button>
          {TICKET_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === s ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {TICKET_STATUS_META[s].label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search ticket # or subject"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <LifeBuoy className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map((t) => {
                const sm = TICKET_STATUS_META[t.status];
                const pm = TICKET_PRIORITY_META[t.priority];
                return (
                  <button
                    key={t.id}
                    onClick={() => setOpenId(t.id)}
                    className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.ticketNumber} · {t.requester.firstName} {t.requester.lastName} ·{' '}
                        <MessageSquare className="inline h-3 w-3" /> {t.messages.length}
                        {t.assignee ? ` · ${t.assignee.firstName}` : ' · Unassigned'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={pm.variant}>{pm.label}</Badge>
                      <Badge variant={sm.variant}>{sm.label}</Badge>
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
            Page {meta.page} of {meta.totalPages} · {meta.total} tickets
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

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          {openId && <TicketThread ticketId={openId} isAgent />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
