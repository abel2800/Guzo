'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Wallet, Undo2, TrendingUp, FileWarning } from 'lucide-react';
import { getFinanceSummary } from '@/lib/finance';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const PIE_COLORS = ['#16a34a', '#2563eb', '#f97316', '#a855f7', '#eab308', '#ef4444', '#0ea5e9'];

export function FinanceRevenue() {
  const { data, isLoading } = useQuery({ queryKey: ['finance-summary'], queryFn: getFinanceSummary });
  const t = data?.totals;
  const chart = data?.paymentsByStatus ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Revenue intelligence"
        icon={TrendingUp}
        title="Revenue"
        description="Money in, refunds out, and outstanding balances with payment status breakdowns."
        stats={[
          { label: 'Net', value: 'After refunds' },
          { label: 'Gross', value: 'Total in' },
          { label: 'Outstanding', value: 'Open balance' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Net Revenue" value={`ETB ${(t?.netRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} loading={isLoading} />
        <StatCard label="Gross Revenue" value={`ETB ${(t?.grossRevenue ?? 0).toLocaleString()}`} icon={Wallet} loading={isLoading} />
        <StatCard label="Refunded" value={`ETB ${(t?.refunded ?? 0).toLocaleString()}`} icon={Undo2} loading={isLoading} />
        <StatCard
          label="Outstanding"
          value={`ETB ${(t?.outstandingAmount ?? 0).toLocaleString()}`}
          icon={FileWarning}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payments by status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chart.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chart}>
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RTooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel icon={Wallet} title="No payment data" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chart.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chart} dataKey="count" nameKey="status" outerRadius={90} label>
                    {chart.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel icon={Wallet} title="No data" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
