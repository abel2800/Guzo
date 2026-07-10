'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { listInvoices, INVOICE_STATUS_META, num } from '@/lib/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FilterChip, FuturisticHero, PaginationBar } from '@/components/dashboard/futuristic-primitives';

const STATUS_FILTERS = ['', 'ISSUED', 'PAID', 'OVERDUE'];

export function MerchantInvoices() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-invoices', status, page],
    queryFn: () => listInvoices({ page, limit: 10, status: status || undefined }),
  });

  const invoices = data?.items ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Billing"
        icon={Receipt}
        title="Invoices"
        description="Invoices for orders placed through your merchant account."
        stats={[{ label: 'Scope', value: 'Your orders' }]}
      />
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <FilterChip key={s || 'all'} active={status === s} onClick={() => { setStatus(s); setPage(1); }}>
            {s ? INVOICE_STATUS_META[s]?.label ?? s : 'All'}
          </FilterChip>
        ))}
      </div>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : invoices.length === 0 ? (
        <EmptyPanel title="No invoices" description="Invoices appear when orders are billed." icon={Receipt} />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono font-semibold text-foreground">{inv.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">Order {inv.order?.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{inv.currency} {num(inv.total).toLocaleString()}</p>
                  <Badge variant={INVOICE_STATUS_META[inv.status]?.variant ?? 'outline'}>
                    {INVOICE_STATUS_META[inv.status]?.label ?? inv.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          <PaginationBar page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
