'use client';

import { useQuery } from '@tanstack/react-query';
import { Receipt, Percent } from 'lucide-react';
import { getFinanceSummary } from '@/lib/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const VAT_RATE = 0.15;

export function FinanceTaxes() {
  const { data, isLoading } = useQuery({ queryKey: ['finance-summary'], queryFn: getFinanceSummary });

  const gross = Number(data?.totals?.grossRevenue ?? 0);
  const net = Number(data?.totals?.netRevenue ?? gross);
  const estimatedVat = Math.round(net * VAT_RATE);

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Compliance"
        icon={Percent}
        title="Tax summary"
        description="Estimated VAT on net platform revenue (15% default rule). Connect ERP export in a later phase."
        stats={[{ label: 'VAT rate', value: '15%' }]}
      />
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : !data ? (
        <EmptyPanel title="No finance data" description="Revenue totals will appear here." icon={Receipt} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Gross revenue" value={`ETB ${gross.toLocaleString()}`} icon={Receipt} />
            <StatCard label="Net revenue" value={`ETB ${net.toLocaleString()}`} icon={Receipt} />
            <StatCard label="Est. VAT (15%)" value={`ETB ${estimatedVat.toLocaleString()}`} icon={Percent} />
          </div>
          <Card>
            <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
              <p>Tax reporting uses net revenue after refunds. Individual order tax lines are stored on each invoice.</p>
              <p>Export detailed filings from Finance → Reports when integrated with your accounting system.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
