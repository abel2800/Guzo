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
import {
  EmptyPanel,
  FuturisticHero,
  PanelSelect,
} from '@/components/dashboard/futuristic-primitives';

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
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Customer care"
            icon={LifeBuoy}
            title="Support"
            description="Get help with your orders and account through a direct support channel."
            stats={[
              { label: 'Tickets', value: 'Your inbox' },
              { label: 'Response', value: 'Team reply' },
              { label: 'Status', value: 'Live updates' },
            ]}
          />
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
            <EmptyPanel
              icon={LifeBuoy}
              title="No tickets yet"
              description="Open a ticket and our team will help you out."
            />
          ) : (
            <div className="dashboard-divide">
              {tickets.map((t) => {
                const sm = TICKET_STATUS_META[t.status];
                const pm = TICKET_PRIORITY_META[t.priority];
                return (
                  <button
                    key={t.id}
                    onClick={() => setOpenId(t.id)}
                    className="dashboard-list-row flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{t.subject}</p>
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
                <PanelSelect value={category} onChange={(e) => setCategory(e.target.value)}>
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </PanelSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <PanelSelect value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TICKET_PRIORITY_META[p].label}
                    </option>
                  ))}
                </PanelSelect>
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
                className="w-full resize-none rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-guzo-primary/40"
              />
            </div>
            <Button className="w-full" onClick={() => create.mutate()} disabled={subject.trim().length < 3 || create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create ticket
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          {openId && <TicketThread ticketId={openId} isAgent={false} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
