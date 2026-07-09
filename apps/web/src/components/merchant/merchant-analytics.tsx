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
import { Package, Truck, CheckCircle2, Wallet } from 'lucide-react';
import { getMerchantSummary } from '@/lib/merchant';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const PIE_COLORS = ['#f97316', '#2563eb', '#16a34a', '#a855f7', '#eab308', '#ef4444', '#0ea5e9'];

export function MerchantAnalytics() {
  const { data, isLoading } = useQuery({ queryKey: ['merchant-analytics'], queryFn: getMerchantSummary });

  const totals = data?.totals;
  const chart = data?.ordersByStatus ?? [];

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Merchant intelligence"
        icon={Package}
        title="Analytics"
        description="Performance across your shipments with status breakdowns and revenue signals."
        stats={[
          { label: 'Orders', value: 'Full funnel' },
          { label: 'Transit', value: 'Live count' },
          { label: 'Revenue', value: 'ETB totals' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={totals?.orders ?? 0} icon={Package} loading={isLoading} />
        <StatCard label="In Transit" value={totals?.inTransit ?? 0} icon={Truck} loading={isLoading} />
        <StatCard label="Delivered" value={totals?.delivered ?? 0} icon={CheckCircle2} loading={isLoading} />
        <StatCard
          label="Revenue"
          value={`ETB ${(totals?.revenue ?? 0).toLocaleString()}`}
          icon={Wallet}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
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
              <EmptyPanel icon={Package} title="No orders yet" />
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
              <EmptyPanel icon={Package} title="No data" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
