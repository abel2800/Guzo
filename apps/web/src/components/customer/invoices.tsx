'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { listInvoices, INVOICE_STATUS_META, num } from '@/lib/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EmptyPanel,
  FilterChip,
  FuturisticHero,
  PaginationBar,
  SearchField,
} from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'ISSUED', 'PAID', 'OVERDUE'];

export function CustomerInvoices() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customer-invoices', status, search, page],
    queryFn: () => listInvoices({ page, limit: 10, status: status || undefined, search: search || undefined }),
  });

  const invoices = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Billing ledger"
        icon={Receipt}
        title="My Invoices"
        description="View billing history for your shipments with clear status signals and searchable records."
        stats={[
          { label: 'History', value: 'Full archive' },
          { label: 'Status', value: 'At a glance' },
          { label: 'Search', value: 'Instant' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <FilterChip
              key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1); }}
              active={status === s}
            >
              {s ? INVOICE_STATUS_META[s]?.label ?? s : 'All'}
            </FilterChip>
          ))}
        </div>
        <SearchField
          placeholder="Search invoice or order"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyPanel
              icon={Receipt}
              title="No invoices yet"
              description="Invoices appear here after you complete shipments."
            />
          ) : (
            <div className="dashboard-divide">
              {invoices.map((inv) => {
                const m = INVOICE_STATUS_META[inv.status] ?? { label: inv.status, variant: 'secondary' as const };
                return (
                  <div key={inv.id} className="dashboard-list-row flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Order {inv.order?.orderNumber ?? '—'} · {new Date(inv.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      {inv.currency} {num(inv.total).toLocaleString()}
                    </p>
                    <Badge variant={m.variant}>{m.label}</Badge>
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
