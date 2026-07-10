'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Wallet, Loader2, Undo2 } from 'lucide-react';
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
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
  SearchField,
} from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'PENDING', 'FAILED'];

export function FinancePayments({
  defaultStatus = '',
  title = 'Payments',
  eyebrow = 'Finance command center',
  icon: Icon = Wallet,
  description = 'Review every transaction, monitor payment health, and issue refunds from a premium finance workflow built for clarity and control.',
  stats = [
    { label: 'Ledger', value: 'Unified' },
    { label: 'Refunds', value: 'Inline actions' },
    { label: 'Signals', value: 'Realtime ready' },
  ],
}: {
  defaultStatus?: string;
  title?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  description?: string;
  stats?: Array<{ label: string; value: string }>;
}) {
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
      <FuturisticHero
        eyebrow={eyebrow}
        icon={Icon}
        title={title}
        description={description}
        stats={stats}
      />

      <div className="flex flex-wrap items-center gap-3">
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
              {s ? PAYMENT_STATUS_META[s]?.label ?? s : 'All'}
            </FilterChip>
          ))}
        </div>
        <SearchField
          placeholder="Search reference / order"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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
            <EmptyPanel icon={Wallet} title="No payments found" />
          ) : (
            <div className="dashboard-divide">
              {payments.map((p) => {
                const m = PAYMENT_STATUS_META[p.status] ?? { label: p.status, variant: 'secondary' as const };
                const refundable = p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED';
                return (
                  <div key={p.id} className="dashboard-list-row flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-foreground">{p.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.order?.orderNumber ?? '—'} · {personName(p.order)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
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

      {meta && (
        <PaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="payments"
          hasPrev={meta.hasPrev}
          hasNext={meta.hasNext}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
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
