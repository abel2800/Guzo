import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export interface LoyaltyProfile {
  loyaltyPoints: number;
  referralCode: string;
  pointsPerDelivery: number;
  referralBonus: number;
}

export interface PendingRatingOrder {
  id: string;
  orderNumber: string;
  deliveredAt?: string | null;
  delivery?: {
    driver?: {
      driverCode: string;
      user?: { firstName?: string; lastName?: string };
    };
  };
}

export interface InsuranceClaim {
  id: string;
  orderId: string;
  status: string;
  description?: string | null;
  amountClaimed?: string | number | null;
  order?: { orderNumber: string; hasInsurance?: boolean };
}

export function getLoyaltyProfile(): Promise<LoyaltyProfile> {
  return apiGet<LoyaltyProfile>('/loyalty/me');
}

export async function applyReferralCode(code: string) {
  const { data } = await api.post<ApiResponse<{ applied: boolean; bonus: number }>>('/loyalty/referral', { code });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export function getPendingRatings(): Promise<PendingRatingOrder[]> {
  return apiGet<PendingRatingOrder[]>('/reviews/pending');
}

export async function rateOrder(orderId: string, rating: number, comment?: string) {
  const { data } = await api.post<ApiResponse<unknown>>(`/reviews/orders/${orderId}`, { rating, comment });
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function listInsuranceClaims(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const { data } = await api.get<ApiResponse<InsuranceClaim[]>>(`/insurance-claims?${qs}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export async function submitInsuranceClaim(body: { orderId: string; description?: string; amountClaimed?: number }) {
  const { data } = await api.post<ApiResponse<InsuranceClaim>>('/insurance-claims', body);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function listActivityLogs(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const { data } = await api.get<ApiResponse<Array<{ id: string; action: string; metadata?: Record<string, unknown> | null; createdAt: string; user?: { email?: string; firstName?: string; lastName?: string } }>>>(`/admin/activity-logs?${qs}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}
