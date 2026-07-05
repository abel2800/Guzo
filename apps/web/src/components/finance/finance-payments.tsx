'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Search, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listPayments,
  refundPayment,
  PAYMENT_STATUS_META,
  personName,
  num,
  type Payment,
} from '@/lib/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const STATUS_FILTERS = ['', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'PENDING', 'FAILED'];

export function FinancePayments({ defaultStatus = '', title = 'Payments' }: { defaultStatus?: string; title?: string }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(defaultStatus);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', status, search, page],
    queryFn: () => listPayments({ page, limit: 12, status: status || undefined, search: search || undefined }),
  });

  const payments = data?.items ?? [];
  const meta = data?.meta;

  const openRefund = (p: Payment) => {
    setRefunding(p);
    setAmount(String(num(p.amount) - num(p.refundedAmount)));
    setReason('');
  };

  const refund = useMutation({
    mutationFn: () => refundPayment(refunding!.id, { amount: Number(amount), reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Refund issued');
      setRefunding(null);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['overview', 'finance'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">Review transactions and issue refunds.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
              {s ? PAYMENT_STATUS_META[s]?.label ?? s : 'All'}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search reference / order"
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
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No payments found</p>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((p) => {
                const m = PAYMENT_STATUS_META[p.status] ?? { label: p.status, variant: 'secondary' as const };
                const refundable = p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED';
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div className="min-w-[160px]">
                      <p className="font-semibold">{p.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.order?.orderNumber ?? '—'} · {personName(p.order)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {p.currency} {num(p.amount).toLocaleString()}
                      </p>
                      {num(p.refundedAmount) > 0 && (
                        <p className="text-xs text-destructive">-{num(p.refundedAmount).toLocaleString()} refunded</p>
                      )}
                    </div>
                    <Badge variant={m.variant}>{m.label}</Badge>
                    {refundable ? (
                      <Button size="sm" variant="outline" onClick={() => openRefund(p)}>
                        <Undo2 className="h-4 w-4" /> Refund
                      </Button>
                    ) : (
                      <span className="w-[90px] text-right text-xs text-muted-foreground">—</span>
                    )}
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
            Page {meta.page} of {meta.totalPages} · {meta.total} payments
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

      <Sheet open={!!refunding} onOpenChange={(o) => !o && setRefunding(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {refunding && (
            <div className="space-y-5">
              <SheetTitle>Refund {refunding.reference}</SheetTitle>
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{refunding.currency} {num(refunding.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already refunded</span>
                  <span>{num(refunding.refundedAmount).toLocaleString()}</span>
                </div>
                <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                  <span>Remaining</span>
                  <span>{(num(refunding.amount) - num(refunding.refundedAmount)).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amt">Refund amount</Label>
                <Input id="amt" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rsn">Reason (optional)</Label>
                <Input id="rsn" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill, damaged item…" />
              </div>
              <Button
                className="w-full"
                onClick={() => refund.mutate()}
                disabled={refund.isPending || Number(amount) <= 0}
              >
                {refund.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                Issue refund
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
