import { apiGet } from './api';

export interface OrdersOverTime {
  day: string;
  count: number;
}

export interface RevenueByType {
  deliveryType: string;
  revenue: number;
  orders: number;
}

export interface TopDriver {
  driverCode: string;
  name: string;
  totalDeliveries: number;
  rating: number;
}

export interface OrdersReport {
  range: { gte: string; lte: string };
  totalOrders: number;
  totalRevenue: number;
  byStatus: Array<{ status: string; count: number }>;
}

export interface DeliveriesReport {
  range: { gte: string; lte: string };
  delivered: number;
  failed: number;
  total: number;
}

function qs(params: Record<string, string | undefined>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) s.set(k, v);
  });
  const q = s.toString();
  return q ? `?${q}` : '';
}

export function getOrdersOverTime(days = 30): Promise<OrdersOverTime[]> {
  return apiGet<OrdersOverTime[]>(`/analytics/orders-over-time?days=${days}`);
}

export function getRevenueByType(): Promise<RevenueByType[]> {
  return apiGet<RevenueByType[]>('/analytics/revenue-by-type');
}

export function getTopDrivers(): Promise<TopDriver[]> {
  return apiGet<TopDriver[]>('/analytics/top-drivers');
}

export function getOrdersReport(from?: string, to?: string): Promise<OrdersReport> {
  return apiGet<OrdersReport>(`/reports/orders${qs({ from, to })}`);
}

export function getDeliveriesReport(from?: string, to?: string): Promise<DeliveriesReport> {
  return apiGet<DeliveriesReport>(`/reports/deliveries${qs({ from, to })}`);
}

export interface OperationsMetrics {
  rangeDays: number;
  delivered: number;
  failedDeliveries: number;
  lostPackages: number;
  lateDeliveries: number;
  latePct: number;
  failPct: number;
  avgDeliveryHours: number;
  branchRankings: Array<{ branchId: string; name: string; city: string; pickups: number; queueLevel: number }>;
}

export interface SatisfactionSummary {
  rangeDays: number;
  averageRating: number;
  totalReviews: number;
  distribution: Array<{ rating: number; count: number }>;
}

export function getOperationsMetrics(days = 30): Promise<OperationsMetrics> {
  return apiGet<OperationsMetrics>(`/analytics/operations-metrics?days=${days}`);
}

export function getSatisfactionSummary(days = 90): Promise<SatisfactionSummary> {
  return apiGet<SatisfactionSummary>(`/analytics/satisfaction?days=${days}`);
}
