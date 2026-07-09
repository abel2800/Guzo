'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTicket,
  addTicketMessage,
  updateTicket,
  TICKET_STATUS_META,
  TICKET_PRIORITY_META,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  type TicketStatus,
  type TicketPriority,
} from '@/lib/tickets';
import { useAuthStore } from '@/lib/auth-store';
import { SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn, initials } from '@/lib/utils';
import { PanelSelect } from '@/components/dashboard/futuristic-primitives';

export function TicketThread({ ticketId, isAgent }: { ticketId: string; isAgent: boolean }) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);

  const { data: ticket, isLoading } = useQuery({ queryKey: ['ticket', ticketId], queryFn: () => getTicket(ticketId) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const reply = useMutation({
    mutationFn: () => addTicketMessage(ticketId, { body: body.trim(), isInternal: isAgent ? internal : false }),
    onSuccess: () => {
      setBody('');
      setInternal(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const triage = useMutation({
    mutationFn: (input: { status?: TicketStatus; priority?: TicketPriority; assigneeId?: string | null }) =>
      updateTicket(ticketId, input),
    onSuccess: () => {
      toast.success('Ticket updated');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !ticket) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const sm = TICKET_STATUS_META[ticket.status];
  const pm = TICKET_PRIORITY_META[ticket.priority];

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 pb-4">
        <SheetTitle className="pr-8">{ticket.subject}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-slate-400">{ticket.ticketNumber}</span>
          <Badge variant={sm.variant}>{sm.label}</Badge>
          <Badge variant={pm.variant}>{pm.label}</Badge>
          {ticket.category && <Badge variant="outline">{ticket.category}</Badge>}
        </div>
        <p className="text-xs text-slate-400">
          From {ticket.requester.firstName} {ticket.requester.lastName}
          {ticket.assignee ? ` · Assigned to ${ticket.assignee.firstName}` : ' · Unassigned'}
        </p>

        {isAgent && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Status
              <PanelSelect
                value={ticket.status}
                onChange={(e) => triage.mutate({ status: e.target.value as TicketStatus })}
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TICKET_STATUS_META[s].label}
                  </option>
                ))}
              </PanelSelect>
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Priority
              <PanelSelect
                value={ticket.priority}
                onChange={(e) => triage.mutate({ priority: e.target.value as TicketPriority })}
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TICKET_PRIORITY_META[p].label}
                  </option>
                ))}
              </PanelSelect>
            </label>
            {ticket.assignee?.id !== currentUserId && (
              <Button size="sm" variant="outline" onClick={() => triage.mutate({ assigneeId: currentUserId })}>
                <ShieldCheck className="h-4 w-4" /> Assign to me
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {ticket.messages.map((m) => {
          const mine = m.author.id === currentUserId;
          return (
            <div key={m.id} className={cn('flex gap-2', mine && 'flex-row-reverse')}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(m.author.firstName, m.author.lastName)}
              </div>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                  m.isInternal
                    ? 'border border-amber-300 bg-amber-50 text-amber-900'
                    : mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                )}
              >
                <div className="mb-0.5 flex items-center gap-1 text-[11px] opacity-80">
                  {m.isInternal && <Lock className="h-3 w-3" />}
                  {m.author.firstName} · {new Date(m.createdAt).toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          reply.mutate();
        }}
        className="space-y-2 pt-4"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={isAgent ? 'Reply to the customer…' : 'Write a message…'}
          className="w-full resize-none rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:ring-2 focus:ring-guzo-primary/40"
        />
        <div className="flex items-center justify-between">
          {isAgent ? (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              <Lock className="h-3 w-3" /> Internal note
            </label>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" disabled={!body.trim() || reply.isPending}>
            {reply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
