'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Search } from 'lucide-react';
import { listInvoices, INVOICE_STATUS_META, num } from '@/lib/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Invoices</h1>
        <p className="text-muted-foreground">View billing history for your shipments.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1); }}
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
            placeholder="Search invoice or order"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
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
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No invoices yet</p>
              <p className="text-sm text-muted-foreground">Invoices appear here after you complete shipments.</p>
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => {
                const m = INVOICE_STATUS_META[inv.status] ?? { label: inv.status, variant: 'secondary' as const };
                return (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
                    <div>
                      <p className="font-semibold">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Order {inv.order?.orderNumber ?? '—'} · {new Date(inv.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-medium">
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
