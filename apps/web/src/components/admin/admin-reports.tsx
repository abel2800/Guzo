'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Package, Truck } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { getOrdersReport, getDeliveriesReport } from '@/lib/analytics';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function AdminReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const ordersQ = useQuery({
    queryKey: ['reports-orders', from, to],
    queryFn: () => getOrdersReport(from || undefined, to || undefined),
  });

  const deliveriesQ = useQuery({
    queryKey: ['reports-deliveries', from, to],
    queryFn: () => getDeliveriesReport(from || undefined, to || undefined),
  });

  const orders = ordersQ.data;
  const deliveries = deliveriesQ.data;
  const isLoading = ordersQ.isLoading || deliveriesQ.isLoading;

  return (
    <div className="space-y-6">
      <FuturisticHero
        eyebrow="Operations reporting"
        icon={FileText}
        title="Reports"
        description="Export-ready summaries for orders and deliveries with configurable date ranges."
        stats={[
          { label: 'Range', value: 'Date filter' },
          { label: 'Orders', value: 'By status' },
          { label: 'Delivery', value: 'Success rate' },
        ]}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => { setFrom(''); setTo(''); }}>
            Reset range
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={orders?.totalOrders ?? 0} icon={Package} loading={isLoading} />
        <StatCard
          label="Order revenue"
          value={`ETB ${(orders?.totalRevenue ?? 0).toLocaleString()}`}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard label="Delivered" value={deliveries?.delivered ?? 0} icon={Truck} loading={isLoading} />
        <StatCard label="Failed" value={deliveries?.failed ?? 0} icon={FileText} loading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders by status</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersQ.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : orders?.byStatus?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={orders.byStatus}>
                <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyPanel icon={Package} title="No orders in range" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
