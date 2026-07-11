import { apiGet, apiPost } from './api';

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
  return apiPost<{ applied: boolean; bonus: number }>('/loyalty/referral', { code });
}

export function getPendingRatings(): Promise<PendingRatingOrder[]> {
  return apiGet<PendingRatingOrder[]>('/reviews/pending');
}

export async function rateOrder(orderId: string, rating: number, comment?: string) {
  return apiPost<unknown>(`/reviews/orders/${orderId}`, { rating, comment });
}

export async function listInsuranceClaims(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return apiGet<InsuranceClaim[]>(`/insurance-claims?${qs}`);
}

export async function submitInsuranceClaim(body: { orderId: string; description?: string; amountClaimed?: number }) {
  return apiPost<InsuranceClaim>('/insurance-claims', body);
}
