'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Plus, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  listTickets,
  createTicket,
  TICKET_STATUS_META,
  TICKET_PRIORITY_META,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketPriority,
} from '@/lib/tickets';
import { TicketThread } from './ticket-thread';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export function CustomerSupport() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('DELIVERY');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['tickets', 'mine'], queryFn: () => listTickets({ limit: 50 }) });
  const tickets = data?.items ?? [];

  const create = useMutation({
    mutationFn: () => createTicket({ subject: subject.trim(), message: message.trim() || undefined, category, priority }),
    onSuccess: (ticket) => {
      toast.success(`Ticket ${ticket.ticketNumber} created`);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setCreating(false);
      setSubject('');
      setMessage('');
      setOpenId(ticket.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground">Get help with your orders and account.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New ticket
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <LifeBuoy className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No tickets yet</p>
              <p className="text-sm text-muted-foreground">Open a ticket and our team will help you out.</p>
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
                        {t.ticketNumber} · {new Date(t.createdAt).toLocaleDateString()} ·{' '}
                        <MessageSquare className="inline h-3 w-3" /> {t.messages.length}
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

      {/* New ticket */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <div className="space-y-5">
            <SheetTitle>New support ticket</SheetTitle>
            <div className="space-y-1.5">
              <Label htmlFor="subj">Subject</Label>
              <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe the issue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TICKET_PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message</Label>
              <textarea
                id="msg"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what happened…"
                className="w-full resize-none rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button className="w-full" onClick={() => create.mutate()} disabled={subject.trim().length < 3 || create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create ticket
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Thread */}
      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          {openId && <TicketThread ticketId={openId} isAgent={false} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
