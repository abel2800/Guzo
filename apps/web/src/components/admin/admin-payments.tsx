'use client';

import { useQuery } from '@tanstack/react-query';
import { Wallet, AlertTriangle } from 'lucide-react';
import { getPaymentReconciliation } from '@/lib/admin-platform';
import { FinancePayments } from '@/components/finance/finance-payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/stat-card';

export function AdminPayments() {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-reconciliation'],
    queryFn: getPaymentReconciliation,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending payment orders"
          value={data?.anomalies.pendingPaymentOrders ?? '—'}
          icon={Wallet}
          loading={isLoading}
        />
        <StatCard
          label="Paid before delivery"
          value={data?.anomalies.paidBeforeDelivery ?? '—'}
          icon={AlertTriangle}
          loading={isLoading}
        />
        <StatCard
          label="Delivered unpaid"
          value={data?.anomalies.deliveredUnpaid ?? '—'}
          icon={AlertTriangle}
          loading={isLoading}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : data?.byStatus.length ? (
        <Card>
          <CardHeader><CardTitle>Ledger by status</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.byStatus.map((row) => (
              <div key={row.status} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase text-slate-400">{row.status}</p>
                <p className="text-lg font-semibold text-white">{row.count}</p>
                <p className="text-sm text-emerald-400">ETB {row.amount.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <FinancePayments
        title="Payments ledger"
        eyebrow="Admin reconciliation"
        description="Full payment ledger with refund actions plus reconciliation anomalies above."
      />
    </div>
  );
}
