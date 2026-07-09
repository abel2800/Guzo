import { API_BASE } from './config';

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface MarketingStat {
  label: string;
  value: string;
}

export interface MarketingStatsPayload {
  stats: MarketingStat[];
  raw: {
    packages: number;
    customers: number;
    drivers: number;
    merchants: number;
    branches: number;
    cities: number;
    inTransit: number;
    activeDeliveries: number;
  };
  runtime: string;
}

export interface TrackPackage {
  id: string;
  trackingNumber: string;
  weightKg?: number;
  description?: string;
}

export interface TrackEvent {
  id: string;
  type: string;
  status: string;
  description?: string;
  createdAt: string;
}

export interface TrackOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
  estimatedDeliveryAt?: string | null;
  pickupAddress?: { city?: string; line1?: string };
  dropoffAddress?: { city?: string; line1?: string; contactName?: string };
  packages: TrackPackage[];
  trackingEvents: TrackEvent[];
  delivery?: {
    driver?: { user?: { firstName?: string; lastName?: string } };
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return body.data;
}

export async function fetchMarketingStats(): Promise<MarketingStatsPayload> {
  const res = await fetch(`${API_BASE}/marketing/stats`, { cache: 'no-store' });
  return parseJson<MarketingStatsPayload>(res);
}

export async function trackShipment(reference: string): Promise<TrackOrder> {
  const q = encodeURIComponent(reference.trim());
  const res = await fetch(`${API_BASE}/orders/track/${q}`, { cache: 'no-store' });
  return parseJson<TrackOrder>(res);
}

export async function submitContact(payload: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/marketing/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await parseJson<{ received: string }>(res);
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/marketing/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  await parseJson<{ subscribed: string }>(res);
}

export async function pingApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    const body = (await res.json()) as ApiEnvelope<{ status: string }>;
    return body.success && body.data?.status === 'ok';
  } catch {
    return false;
  }
}
