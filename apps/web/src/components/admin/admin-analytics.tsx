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
import { Package, Truck, Wallet, TrendingUp } from 'lucide-react';
import { getOrdersOverTime, getRevenueByType, getTopDrivers } from '@/lib/analytics';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PIE_COLORS = ['#22c55e', '#2563eb', '#f97316', '#a855f7', '#eab308', '#ef4444'];

export function AdminAnalytics() {
  const ordersQ = useQuery({ queryKey: ['analytics-orders-over-time'], queryFn: () => getOrdersOverTime(30) });
  const revenueQ = useQuery({ queryKey: ['analytics-revenue-by-type'], queryFn: getRevenueByType });
  const driversQ = useQuery({ queryKey: ['analytics-top-drivers'], queryFn: getTopDrivers });

  const isLoading = ordersQ.isLoading || revenueQ.isLoading || driversQ.isLoading;
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Platform-wide performance and delivery insights.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders (30d)" value={totalOrders} icon={Package} loading={isLoading} />
        <StatCard label="Revenue" value={`ETB ${totalRevenue.toLocaleString()}`} icon={Wallet} loading={isLoading} />
        <StatCard label="Delivery types" value={revenue.length} icon={TrendingUp} loading={isLoading} />
        <StatCard label="Top drivers" value={drivers.length} icon={Truck} loading={isLoading} />
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
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No order data yet.</div>
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
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No revenue data.</div>
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
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No driver stats yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
