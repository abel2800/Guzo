'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Search, Loader2, CheckCircle2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import {
  listInvoices,
  updateInvoiceStatus,
  INVOICE_STATUS_META,
  personName,
  num,
  type Invoice,
} from '@/lib/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_FILTERS = ['', 'ISSUED', 'PAID', 'OVERDUE', 'VOID'];

export function FinanceInvoices() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status, search, page],
    queryFn: () => listInvoices({ page, limit: 12, status: status || undefined, search: search || undefined }),
  });

  const invoices = data?.items ?? [];
  const meta = data?.meta;

  const setStatusMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: Invoice['status'] }) => updateInvoiceStatus(id, next),
    onSuccess: () => {
      toast.success('Invoice updated');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">Track billing and settle outstanding invoices.</p>
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
              {s ? INVOICE_STATUS_META[s]?.label ?? s : 'All'}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search invoice / order"
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
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No invoices found</p>
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => {
                const m = INVOICE_STATUS_META[inv.status] ?? { label: inv.status, variant: 'secondary' as const };
                const busy = setStatusMut.isPending;
                return (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div className="min-w-[160px]">
                      <p className="font-semibold">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.order?.orderNumber ?? '—'} · {personName(inv.order)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {inv.currency} {num(inv.total).toLocaleString()}
                    </p>
                    <Badge variant={m.variant}>{m.label}</Badge>
                    <div className="flex gap-2">
                      {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setStatusMut.mutate({ id: inv.id, next: 'PAID' })}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setStatusMut.mutate({ id: inv.id, next: 'VOID' })}
                          >
                            <Ban className="h-4 w-4" /> Void
                          </Button>
                        </>
                      )}
                    </div>
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
            Page {meta.page} of {meta.totalPages} · {meta.total} invoices
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
    </div>
  );
}
