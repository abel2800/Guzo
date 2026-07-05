'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Package, Truck, Users, Wallet, Activity, Clock, CheckCircle2, LifeBuoy } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_CONFIG, type RoleSlug } from '@/lib/roles';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminOverview {
  totals?: {
    users: number;
    orders: number;
    approvedDrivers: number;
    activeDeliveries: number;
    pendingOrders: number;
    revenue: number;
  };
  ordersByStatus?: Array<{ status: string; count: number }>;
}

interface DriverOverview {
  activeDeliveries?: number;
  completedDeliveries?: number;
  earningsBalance?: number;
  rating?: number;
}

interface MerchantOverview {
  totals?: {
    orders: number;
    delivered: number;
    inTransit: number;
    pendingPayment: number;
    revenue: number;
  };
  ordersByStatus?: Array<{ status: string; count: number }>;
}

interface WarehouseOverview {
  totals?: {
    warehouses: number;
    inStock: number;
    receivedToday: number;
    dispatchedToday: number;
  };
  packagesByStatus?: Array<{ status: string; count: number }>;
}

interface FinanceOverview {
  totals?: {
    grossRevenue: number;
    refunded: number;
    netRevenue: number;
    paidCount: number;
    pendingCount: number;
    refundedCount: number;
    outstandingInvoices: number;
    outstandingAmount: number;
  };
  paymentsByStatus?: Array<{ status: string; count: number }>;
}

interface CustomerOverview {
  totals?: { orders: number; inTransit: number; delivered: number; openTickets: number };
  ordersByStatus?: Array<{ status: string; count: number }>;
}

interface SupportOverview {
  totals?: { open: number; inProgress: number; waiting: number; resolvedToday: number; total: number };
  ticketsByStatus?: Array<{ status: string; count: number }>;
}

export default function OverviewPage() {
  const params = useParams();
  const slug = params.role as RoleSlug;
  const config = ROLE_CONFIG[slug];
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['overview', slug],
    queryFn: async () => {
      const { data } = await api.get(config.overviewEndpoint);
      return data as { data?: AdminOverview & DriverOverview; meta?: { total?: number } } & AdminOverview &
        DriverOverview;
    },
  });

  const isMerchant = slug === 'merchant';
  const isWarehouse = slug === 'warehouse' || slug === 'warehouse-manager';
  const isFinance = slug === 'finance';
  const isCustomer = slug === 'customer';
  const isSupport = slug === 'support';
  const admin = (data?.data ?? data) as AdminOverview | undefined;
  const driver = (data?.data ?? data) as DriverOverview | undefined;
  const merchant = (data?.data ?? data) as MerchantOverview | undefined;
  const warehouse = (data?.data ?? data) as WarehouseOverview | undefined;
  const finance = (data?.data ?? data) as FinanceOverview | undefined;
  const customer = (data?.data ?? data) as CustomerOverview | undefined;
  const support = (data?.data ?? data) as SupportOverview | undefined;
  const totals = admin?.totals;
  const merchantTotals = merchant?.totals;
  const warehouseTotals = warehouse?.totals;
  const financeTotals = finance?.totals;
  const customerTotals = customer?.totals;
  const supportTotals = support?.totals;
  const chart =
    (isWarehouse
      ? warehouse?.packagesByStatus
      : isFinance
        ? finance?.paymentsByStatus
        : isSupport
          ? support?.ticketsByStatus
          : isCustomer
            ? customer?.ordersByStatus
            : admin?.ordersByStatus ?? merchant?.ordersByStatus) ?? [];
  const chartLabel = isWarehouse
    ? 'Packages by status'
    : isFinance
      ? 'Payments by status'
      : isSupport
        ? 'Tickets by status'
        : 'Orders by status';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">{config.label} Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user ? `, ${user.firstName}` : ''}. Here is your overview.
        </p>
      </motion.div>

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isFinance && financeTotals ? (
          <>
            <StatCard label="Net Revenue" value={`ETB ${financeTotals.netRevenue.toLocaleString()}`} icon={Wallet} loading={isLoading} />
            <StatCard label="Refunded" value={`ETB ${financeTotals.refunded.toLocaleString()}`} icon={Activity} loading={isLoading} />
            <StatCard label="Paid" value={financeTotals.paidCount} icon={Package} loading={isLoading} />
            <StatCard label="Outstanding Inv." value={financeTotals.outstandingInvoices} icon={Clock} loading={isLoading} />
          </>
        ) : isWarehouse && warehouseTotals ? (
          <>
            <StatCard label="In Stock" value={warehouseTotals.inStock} icon={Package} loading={isLoading} />
            <StatCard label="Received Today" value={warehouseTotals.receivedToday} icon={Activity} loading={isLoading} />
            <StatCard label="Dispatched Today" value={warehouseTotals.dispatchedToday} icon={Truck} loading={isLoading} />
            <StatCard label="Warehouses" value={warehouseTotals.warehouses} icon={Users} loading={isLoading} />
          </>
        ) : isMerchant && merchantTotals ? (
          <>
            <StatCard label="Total Orders" value={merchantTotals.orders} icon={Package} loading={isLoading} />
            <StatCard label="In Transit" value={merchantTotals.inTransit} icon={Truck} loading={isLoading} />
            <StatCard label="Delivered" value={merchantTotals.delivered} icon={CheckCircle2} loading={isLoading} />
            <StatCard
              label="Revenue"
              value={`ETB ${merchantTotals.revenue.toLocaleString()}`}
              icon={Wallet}
              loading={isLoading}
            />
          </>
        ) : isCustomer && customerTotals ? (
          <>
            <StatCard label="My Orders" value={customerTotals.orders} icon={Package} loading={isLoading} />
            <StatCard label="In Transit" value={customerTotals.inTransit} icon={Truck} loading={isLoading} />
            <StatCard label="Delivered" value={customerTotals.delivered} icon={CheckCircle2} loading={isLoading} />
            <StatCard label="Open Tickets" value={customerTotals.openTickets} icon={LifeBuoy} loading={isLoading} />
          </>
        ) : isSupport && supportTotals ? (
          <>
            <StatCard label="Open" value={supportTotals.open} icon={LifeBuoy} loading={isLoading} />
            <StatCard label="In Progress" value={supportTotals.inProgress} icon={Activity} loading={isLoading} />
            <StatCard label="Waiting" value={supportTotals.waiting} icon={Clock} loading={isLoading} />
            <StatCard label="Resolved Today" value={supportTotals.resolvedToday} icon={CheckCircle2} loading={isLoading} />
          </>
        ) : totals ? (
          <>
            <StatCard label="Total Orders" value={totals.orders} icon={Package} loading={isLoading} />
            <StatCard
              label="Revenue"
              value={`ETB ${totals.revenue.toLocaleString()}`}
              icon={Wallet}
              loading={isLoading}
            />
            <StatCard label="Active Deliveries" value={totals.activeDeliveries} icon={Truck} loading={isLoading} />
            <StatCard label="Users" value={totals.users} icon={Users} loading={isLoading} />
          </>
        ) : driver?.earningsBalance !== undefined ? (
          <>
            <StatCard label="Active Deliveries" value={driver.activeDeliveries ?? 0} icon={Truck} loading={isLoading} />
            <StatCard label="Completed" value={driver.completedDeliveries ?? 0} icon={Activity} loading={isLoading} />
            <StatCard
              label="Earnings"
              value={`ETB ${(driver.earningsBalance ?? 0).toLocaleString()}`}
              icon={Wallet}
              loading={isLoading}
            />
            <StatCard label="Rating" value={`${driver.rating ?? 0} / 5`} icon={Activity} loading={isLoading} />
          </>
        ) : (
          <>
            <StatCard label="Records" value={data?.meta?.total ?? '—'} icon={Package} loading={isLoading} />
            <StatCard label="Role" value={config.label} icon={Users} />
            <StatCard label="Permissions" value={user?.permissions.length ?? '—'} icon={Activity} />
            <StatCard label="Status" value={isError ? 'Offline' : 'Connected'} icon={Clock} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{chartLabel}</CardTitle>
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
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No chart data for this role yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live data</CardTitle>
          </CardHeader>
          <CardContent>
            {isError ? (
              <p className="text-sm text-destructive">Could not reach the API. Is the server on :4000?</p>
            ) : (
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(data ?? {}, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
