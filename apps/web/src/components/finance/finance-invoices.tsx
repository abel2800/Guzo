'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Loader2, CheckCircle2, Ban } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
  SearchField,
} from '@/components/dashboard/futuristic-primitives';

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
      <FuturisticHero
        eyebrow="Billing operations"
        icon={Receipt}
        title="Invoices"
        description="Track billing and settle outstanding invoices from a unified finance command view."
        stats={[
          { label: 'Status', value: 'Lifecycle' },
          { label: 'Actions', value: 'Mark paid' },
          { label: 'Search', value: 'Instant' },
        ]}
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
              {s ? INVOICE_STATUS_META[s]?.label ?? s : 'All'}
            </FilterChip>
          ))}
        </div>
        <SearchField
          placeholder="Search invoice / order"
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
          ) : invoices.length === 0 ? (
            <EmptyPanel icon={Receipt} title="No invoices found" />
          ) : (
            <div className="dashboard-divide">
              {invoices.map((inv) => {
                const m = INVOICE_STATUS_META[inv.status] ?? { label: inv.status, variant: 'secondary' as const };
                const busy = setStatusMut.isPending;
                return (
                  <div key={inv.id} className="dashboard-list-row flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.order?.orderNumber ?? '—'} · {personName(inv.order)}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
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

      {meta && (
        <PaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="invoices"
          hasPrev={meta.hasPrev}
          hasNext={meta.hasNext}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
