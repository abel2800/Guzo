'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Package, Truck, Wallet, TrendingUp, Star, AlertTriangle, Clock } from 'lucide-react';
import {
  getOperationsMetrics,
  getOrdersOverTime,
  getRevenueByType,
  getSatisfactionSummary,
  getTopDrivers,
} from '@/lib/analytics';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

const PIE_COLORS = ['#22c55e', '#2563eb', '#f97316', '#a855f7', '#eab308', '#ef4444'];

export function AdminAnalytics() {
  const ordersQ = useQuery({ queryKey: ['analytics-orders-over-time'], queryFn: () => getOrdersOverTime(30) });
  const revenueQ = useQuery({ queryKey: ['analytics-revenue-by-type'], queryFn: getRevenueByType });
  const driversQ = useQuery({ queryKey: ['analytics-top-drivers'], queryFn: getTopDrivers });
  const opsQ = useQuery({ queryKey: ['analytics-ops-metrics'], queryFn: () => getOperationsMetrics(30) });
  const satQ = useQuery({ queryKey: ['analytics-satisfaction'], queryFn: () => getSatisfactionSummary(90) });

  const isLoading = ordersQ.isLoading || revenueQ.isLoading || driversQ.isLoading;
  const ops = opsQ.data;
  const satisfaction = satQ.data;
  const orders = ordersQ.data ?? [];
  const revenue = revenueQ.data ?? [];
  const drivers = driversQ.data ?? [];

  const totalOrders = orders.reduce((s, r) => s + r.count, 0);
  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);

  const lineData = orders.map((r) => ({
    day: new Date(r.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: r.count,
  }));

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Platform intelligence"
        icon={Package}
        title="Analytics"
        description="Platform-wide performance and delivery insights with trend charts and driver rankings."
        stats={[
          { label: 'Orders', value: '30-day trend' },
          { label: 'Revenue', value: 'By type' },
          { label: 'Drivers', value: 'Top performers' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders (30d)" value={totalOrders} icon={Package} loading={isLoading} />
        <StatCard label="Revenue" value={`ETB ${totalRevenue.toLocaleString()}`} icon={Wallet} loading={isLoading} />
        <StatCard label="Late delivery %" value={`${ops?.latePct ?? 0}%`} icon={AlertTriangle} loading={opsQ.isLoading} />
        <StatCard label="Avg delivery (h)" value={ops?.avgDeliveryHours ?? '—'} icon={Clock} loading={opsQ.isLoading} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lost parcels" value={ops?.lostPackages ?? 0} icon={AlertTriangle} loading={opsQ.isLoading} />
        <StatCard label="Failed deliveries" value={ops?.failedDeliveries ?? 0} icon={Truck} loading={opsQ.isLoading} />
        <StatCard label="Avg rating" value={satisfaction?.averageRating ?? '—'} icon={Star} loading={satQ.isLoading} />
        <StatCard label="Reviews" value={satisfaction?.totalReviews ?? 0} icon={TrendingUp} loading={satQ.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders over time</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersQ.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : lineData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={lineData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RTooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel icon={Package} title="No order data yet" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by delivery type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueQ.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenue.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={revenue} dataKey="revenue" nameKey="deliveryType" outerRadius={90} label>
                    {revenue.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel icon={Wallet} title="No revenue data" />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {driversQ.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : drivers.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={drivers}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <RTooltip />
                  <Bar dataKey="totalDeliveries" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel icon={Truck} title="No driver stats yet" />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Branch rankings (pickups)</CardTitle>
          </CardHeader>
          <CardContent>
            {opsQ.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : ops?.branchRankings.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ops.branchRankings}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <RTooltip />
                  <Bar dataKey="pickups" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel icon={Package} title="No branch pickup data" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
