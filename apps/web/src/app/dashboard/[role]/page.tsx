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
import { Package, Truck, Users, Wallet, Activity, Clock, CheckCircle2, LifeBuoy, MapPin } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { ROLE_CONFIG, type RoleSlug } from '@/lib/roles';
import { StatCard } from '@/components/dashboard/stat-card';
import { EmptyPanel } from '@/components/dashboard/futuristic-primitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AdminOverview {
  totals?: {
    users: number;
    orders: number;
    approvedDrivers: number;
    activeDeliveries: number;
    pendingOrders: number;
    revenue: number;
    warehouses?: number;
    branches?: number;
    merchants?: number;
    pendingUsers?: number;
    pendingDrivers?: number;
  };
  growth?: {
    ordersLast7d: number;
    ordersPrev7d: number;
    orderGrowthPct: number;
    revenueLast7d: number;
    revenuePrev7d: number;
    revenueGrowthPct: number;
  };
  ordersByStatus?: Array<{ status: string; count: number }>;
}

interface DriverOverview {
  activeDeliveries?: number;
  completedDeliveries?: number;
  earningsBalance?: number;
  rating?: number;
  today?: {
    pickups: number;
    deliveries: number;
    intercity: number;
    available: number;
  };
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
    totalCapacity?: number;
    capacityPercent?: number;
    trucksInTransit?: number;
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

interface BranchOverview {
  totals?: {
    inStock: number;
    incomingToday: number;
    outgoing: number;
    readyForPickup: number;
    pickedUpToday: number;
  };
}

type DashboardOverview = AdminOverview &
  DriverOverview &
  MerchantOverview &
  WarehouseOverview &
  FinanceOverview &
  CustomerOverview &
  SupportOverview & {
    merchantCode?: string;
    businessName?: string;
    driverCode?: string;
    status?: string;
    isAvailable?: boolean;
  };

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function SnapshotRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function StatusBreakdown({ rows }: { rows: Array<{ status: string; count: number }> }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.status} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{formatStatusLabel(row.status)}</span>
            <span className="font-semibold text-foreground">{row.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-guzo-primary transition-all"
              style={{ width: `${Math.max((row.count / max) * 100, row.count > 0 ? 8 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function OverviewPage() {
  const params = useParams();
  const slug = params.role as RoleSlug;
  const config = ROLE_CONFIG[slug];
  const user = useAuthStore((s) => s.user);
  const isBranch = slug === 'branch';

  const { data: branchAssignments } = useQuery({
    queryKey: ['branch-me'],
    queryFn: () => apiGet<Array<{ branchId: string; branch?: { name: string } }>>('/branch-staff/me'),
    enabled: isBranch,
  });
  const branchId = branchAssignments?.[0]?.branchId;

  const branchOverviewQuery = useQuery({
    queryKey: ['overview', 'branch', branchId],
    queryFn: () => apiGet<BranchOverview>(`/dashboard/branch?branchId=${branchId}`),
    enabled: isBranch && !!branchId,
  });

  const defaultOverviewQuery = useQuery({
    queryKey: ['overview', slug],
    queryFn: () => apiGet<DashboardOverview>(config.overviewEndpoint),
    enabled: !isBranch,
  });

  const isLoading = isBranch ? branchOverviewQuery.isLoading : defaultOverviewQuery.isLoading;
  const isError = isBranch ? branchOverviewQuery.isError : defaultOverviewQuery.isError;
  const overview = isBranch ? undefined : defaultOverviewQuery.data;
  const branchOverview = isBranch ? branchOverviewQuery.data : undefined;

  const isDriver = slug === 'driver';
  const isMerchant = slug === 'merchant';
  const isWarehouse = slug === 'warehouse' || slug === 'warehouse-manager';
  const isFinance = slug === 'finance';
  const isCustomer = slug === 'customer';
  const isSupport = slug === 'support';
  const isAdminOverview = slug === 'admin' || slug === 'super-admin' || slug === 'operations';
  const admin = overview;
  const driver = overview;
  const merchant = overview;
  const warehouse = overview;
  const finance = overview;
  const customer = overview;
  const support = overview;
  const totals = admin?.totals;
  const merchantTotals = merchant?.totals;
  const warehouseTotals = warehouse?.totals;
  const financeTotals = finance?.totals;
  const customerTotals = customer?.totals;
  const supportTotals = support?.totals;
  const branchTotals = branchOverview?.totals;
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
  const heroAccent = isFinance
    ? 'Finance command center'
    : isBranch
      ? 'Branch operations'
      : isWarehouse
      ? 'Warehouse flow'
      : isMerchant
        ? 'Merchant growth'
        : isCustomer
          ? 'Customer command'
          : isSupport
            ? 'Support pulse'
            : isDriver
              ? 'Driver cockpit'
              : 'Operations nerve center';

  const growth = admin?.growth;
  const snapshotRows: Array<{ label: string; value: string | number }> = isBranch && branchTotals
    ? [
        { label: 'In stock', value: branchTotals.inStock },
        { label: 'Incoming today', value: branchTotals.incomingToday },
        { label: 'Outgoing', value: branchTotals.outgoing },
        { label: 'Ready for pickup', value: branchTotals.readyForPickup },
      ]
    : isFinance && financeTotals
    ? [
        { label: 'Gross revenue', value: `ETB ${financeTotals.grossRevenue.toLocaleString()}` },
        { label: 'Net revenue', value: `ETB ${financeTotals.netRevenue.toLocaleString()}` },
        { label: 'Pending payments', value: financeTotals.pendingCount },
        { label: 'Outstanding invoices', value: financeTotals.outstandingInvoices },
      ]
    : isWarehouse && warehouseTotals
      ? [
          { label: 'Units in stock', value: warehouseTotals.inStock },
          { label: 'Capacity used', value: `${warehouseTotals.capacityPercent ?? 0}%` },
          { label: 'Trucks in transit', value: warehouseTotals.trucksInTransit ?? 0 },
          { label: 'Received today', value: warehouseTotals.receivedToday },
        ]
      : isMerchant && merchantTotals
        ? [
            ...(overview?.businessName ? [{ label: 'Business', value: overview.businessName }] : []),
            { label: 'Total orders', value: merchantTotals.orders },
            { label: 'In transit', value: merchantTotals.inTransit },
            { label: 'Pending payment', value: merchantTotals.pendingPayment },
          ]
        : isCustomer && customerTotals
          ? [
              { label: 'Total orders', value: customerTotals.orders },
              { label: 'In transit', value: customerTotals.inTransit },
              { label: 'Delivered', value: customerTotals.delivered },
              { label: 'Open tickets', value: customerTotals.openTickets },
            ]
          : isSupport && supportTotals
            ? [
                { label: 'Open tickets', value: supportTotals.open },
                { label: 'In progress', value: supportTotals.inProgress },
                { label: 'Waiting on customer', value: supportTotals.waiting },
                { label: 'Resolved today', value: supportTotals.resolvedToday },
              ]
            : isDriver && driver
              ? [
                  ...(overview?.driverCode ? [{ label: 'Driver code', value: overview.driverCode }] : []),
                  { label: 'Active deliveries', value: driver.activeDeliveries ?? 0 },
                  { label: 'Completed', value: driver.completedDeliveries ?? 0 },
                  {
                    label: 'Availability',
                    value: overview?.isAvailable ? 'Available' : 'Unavailable',
                  },
                ]
              : totals
                ? [
                    { label: 'Registered users', value: totals.users },
                    { label: 'Total orders', value: totals.orders },
                    ...(isAdminOverview && totals.warehouses != null
                      ? [{ label: 'Warehouses', value: totals.warehouses }]
                      : [{ label: 'Active deliveries', value: totals.activeDeliveries }]),
                    ...(isAdminOverview && totals.branches != null
                      ? [{ label: 'Branches', value: totals.branches }]
                      : [{ label: 'Pending orders', value: totals.pendingOrders }]),
                  ]
                : [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="dashboard-hero">
        <div className="dashboard-orb -right-8 top-0 h-28 w-28 bg-guzo-primary/20" />
        <div className="dashboard-orb bottom-0 left-8 h-24 w-24 bg-emerald-400/10" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-guzo-primary/25 bg-guzo-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-guzo-primary">
              {heroAccent}
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                {config.label} Dashboard
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Welcome back{user ? `, ${user.firstName}` : ''}. Your live GUZO workspace combines
                realtime operations, financial signals, tracking activity, and role-based actions in
                one futuristic control surface.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Role</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{config.label}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Realtime</p>
              <p className="mt-2 text-lg font-semibold text-foreground">Connected workflow</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Experience</p>
              <p className="mt-2 text-lg font-semibold text-foreground">Glass + glow UI</p>
            </div>
          </div>
        </div>
      </motion.div>

      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isFinance && financeTotals ? (
          <>
            <StatCard label="Net Revenue" value={`ETB ${financeTotals.netRevenue.toLocaleString()}`} icon={Wallet} loading={isLoading} />
            <StatCard label="Refunded" value={`ETB ${financeTotals.refunded.toLocaleString()}`} icon={Activity} loading={isLoading} />
            <StatCard label="Paid" value={financeTotals.paidCount} icon={Package} loading={isLoading} />
            <StatCard label="Outstanding Inv." value={financeTotals.outstandingInvoices} icon={Clock} loading={isLoading} />
          </>
        ) : isBranch && branchTotals ? (
          <>
            <StatCard label="In stock" value={branchTotals.inStock} icon={Package} loading={isLoading} href={`/dashboard/${slug}/inventory`} />
            <StatCard label="Incoming today" value={branchTotals.incomingToday} icon={Activity} loading={isLoading} href={`/dashboard/${slug}/receive`} />
            <StatCard label="Outgoing" value={branchTotals.outgoing} icon={Truck} loading={isLoading} href={`/dashboard/${slug}/counter`} />
            <StatCard label="Ready for pickup" value={branchTotals.readyForPickup} icon={CheckCircle2} loading={isLoading} href={`/dashboard/${slug}/counter`} />
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
            <StatCard label="Total Orders" value={merchantTotals.orders} icon={Package} loading={isLoading} href={`/dashboard/${slug}/orders`} />
            <StatCard label="In Transit" value={merchantTotals.inTransit} icon={Truck} loading={isLoading} href={`/dashboard/${slug}/orders`} />
            <StatCard label="Delivered" value={merchantTotals.delivered} icon={CheckCircle2} loading={isLoading} href={`/dashboard/${slug}/orders`} />
            <StatCard
              label="Revenue"
              value={`ETB ${merchantTotals.revenue.toLocaleString()}`}
              icon={Wallet}
              loading={isLoading}
              href={`/dashboard/${slug}/analytics`}
            />
          </>
        ) : isCustomer && customerTotals ? (
          <>
            <StatCard label="My Orders" value={customerTotals.orders} icon={Package} loading={isLoading} href={`/dashboard/${slug}/orders`} />
            <StatCard label="In Transit" value={customerTotals.inTransit} icon={Truck} loading={isLoading} href={`/dashboard/${slug}/track`} />
            <StatCard label="Delivered" value={customerTotals.delivered} icon={CheckCircle2} loading={isLoading} href={`/dashboard/${slug}/orders`} />
            <StatCard label="Open Tickets" value={customerTotals.openTickets} icon={LifeBuoy} loading={isLoading} href={`/dashboard/${slug}/support`} />
          </>
        ) : isSupport && supportTotals ? (
          <>
            <StatCard label="Open" value={supportTotals.open} icon={LifeBuoy} loading={isLoading} href={`/dashboard/${slug}/tickets`} />
            <StatCard label="In Progress" value={supportTotals.inProgress} icon={Activity} loading={isLoading} href={`/dashboard/${slug}/tickets`} />
            <StatCard label="Waiting" value={supportTotals.waiting} icon={Clock} loading={isLoading} href={`/dashboard/${slug}/tickets`} />
            <StatCard label="Resolved Today" value={supportTotals.resolvedToday} icon={CheckCircle2} loading={isLoading} href={`/dashboard/${slug}/tickets`} />
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
            {isAdminOverview ? (
              <>
                <StatCard label="Pending accounts" value={totals.pendingUsers ?? 0} icon={Users} loading={isLoading} />
                <StatCard label="Pending drivers" value={totals.pendingDrivers ?? 0} icon={Truck} loading={isLoading} />
                <StatCard label="Drivers" value={totals.approvedDrivers} icon={Truck} loading={isLoading} />
                <StatCard label="Branches" value={totals.branches ?? 0} icon={MapPin} loading={isLoading} />
              </>
            ) : (
              <>
                <StatCard label="Active Deliveries" value={totals.activeDeliveries} icon={Truck} loading={isLoading} />
                <StatCard label="Users" value={totals.users} icon={Users} loading={isLoading} />
              </>
            )}
          </>
        ) : driver?.earningsBalance !== undefined ? (
          <>
            <StatCard label="Pickups today" value={overview?.today?.pickups ?? 0} icon={Package} loading={isLoading} href={`/dashboard/${slug}/available`} />
            <StatCard label="Deliveries today" value={overview?.today?.deliveries ?? 0} icon={CheckCircle2} loading={isLoading} href={`/dashboard/${slug}/accepted`} />
            <StatCard label="Intercity trips" value={overview?.today?.intercity ?? 0} icon={Truck} loading={isLoading} href={`/dashboard/${slug}/manifests`} />
            <StatCard
              label="Earnings"
              value={`ETB ${(driver.earningsBalance ?? 0).toLocaleString()}`}
              icon={Wallet}
              loading={isLoading}
              href={`/dashboard/${slug}/earnings`}
            />
          </>
        ) : isLoading ? (
          <>
            <StatCard label="Loading" value="—" icon={Package} loading />
            <StatCard label="Loading" value="—" icon={Users} loading />
            <StatCard label="Loading" value="—" icon={Activity} loading />
            <StatCard label="Loading" value="—" icon={Clock} loading />
          </>
        ) : (
          <>
            <StatCard label="Role" value={config.label} icon={Users} />
            <StatCard label="Permissions" value={user?.permissions.length ?? '—'} icon={Activity} />
            <StatCard label="API" value={isError ? 'Offline' : 'Connected'} icon={Clock} />
            <StatCard label="Workspace" value="Ready" icon={Package} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">{chartLabel}</CardTitle>
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
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#22C55E" />
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-foreground">Activity snapshot</CardTitle>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide',
                isError
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-guzo-primary/30 bg-guzo-primary/10 text-guzo-primary',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isError ? 'bg-red-400' : 'animate-pulse bg-guzo-primary',
                )}
              />
              {isError ? 'Offline' : isLoading ? 'Syncing' : 'Live'}
            </span>
          </CardHeader>
          <CardContent className="space-y-5">
            {isError ? (
              <p className="text-sm text-destructive">Could not reach the API. Is the server running?</p>
            ) : isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                {snapshotRows.length ? (
                  <div className="space-y-2">
                    {snapshotRows.map((row) => (
                      <SnapshotRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                ) : (
                  <EmptyPanel
                    icon={Activity}
                    title="No summary yet"
                    description="Metrics will appear here once your role has activity in the system."
                  />
                )}

                {chart.length ? (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {chartLabel}
                    </p>
                    <StatusBreakdown rows={chart} />
                  </div>
                ) : null}

                {isAdminOverview && growth ? (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">7-day growth</p>
                    <SnapshotRow
                      label="Order growth"
                      value={`${growth.orderGrowthPct >= 0 ? '+' : ''}${growth.orderGrowthPct}%`}
                    />
                    <SnapshotRow
                      label="Revenue growth"
                      value={`${growth.revenueGrowthPct >= 0 ? '+' : ''}${growth.revenueGrowthPct}%`}
                    />
                    <SnapshotRow label="Orders (7d)" value={growth.ordersLast7d} />
                    <SnapshotRow label="Revenue (7d)" value={`ETB ${growth.revenueLast7d.toLocaleString()}`} />
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
