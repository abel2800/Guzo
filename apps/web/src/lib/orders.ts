import { api, apiGet } from './api';
import type { ApiResponse } from '@delivery/types';

export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'SCHEDULED' | 'INTERNATIONAL';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_WAREHOUSE'
  | 'AT_BRANCH'
  | 'AT_DESTINATION_BRANCH'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface PackageInput {
  description?: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  isFragile?: boolean;
}

export type PickupMethod = 'COMPANY_PICKUP' | 'DROP_AT_BRANCH' | 'BRANCH_PICKUP';

export interface CreateOrderInput {
  deliveryType?: DeliveryType;
  pickup: AddressInput;
  dropoff: AddressInput;
  package: PackageInput;
  couponCode?: string;
  notes?: string;
  scheduledPickupAt?: string;
  pickupMethod?: 'COMPANY_PICKUP' | 'DROP_AT_BRANCH' | 'BRANCH_PICKUP';
  paymentMethod?: string;
  payLater?: boolean;
  originBranchId?: string;
  destinationBranchId?: string;
  receiverPhone?: string;
  receiverGuzoId?: string;
}

export interface PriceBreakdown {
  distanceKm: number;
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  surge: number;
  discount: number;
  tax: number;
  totalAmount: number;
  currency: string;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
}

export interface TrackingEvent {
  id: string;
  type: string;
  status: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  distanceKm?: number | null;
  totalAmount: number;
  currency: string;
  createdAt: string;
  estimatedDeliveryAt?: string | null;
  pickupMethod?: PickupMethod;
  receiverPhone?: string | null;
  pickupAddress: Address;
  dropoffAddress: Address;
  packages: Array<{
    id: string;
    trackingNumber: string;
    weightKg: number;
    description?: string | null;
    pickupPin?: string | null;
    qrCode?: string | null;
  }>;
  trackingEvents: TrackingEvent[];
  payment?: { status: string; amount: number; currency: string } | null;
  invoice?: { invoiceNumber: string; status: string; total: number } | null;
  customer?: {
    id: string;
    user?: { firstName: string; lastName: string; phone?: string | null } | null;
  } | null;
  delivery?: {
    id?: string;
    driverId?: string;
    recipientName?: string | null;
    deliveredAt?: string | null;
    driver?: {
      id?: string;
      currentLat?: number | null;
      currentLng?: number | null;
      user?: {
        firstName: string;
        lastName: string;
        phone?: string | null;
        avatarUrl?: string | null;
      } | null;
    } | null;
    vehicle?: {
      type: string;
      plateNumber: string;
      brand?: string | null;
      model?: string | null;
      color?: string | null;
      photoUrl?: string | null;
    } | null;
    proofFile?: { storageKey: string; mimeType?: string | null } | null;
    signatureFile?: { storageKey: string } | null;
  } | null;
}

const FILE_ORIGIN = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4010';
export function fileUrl(storageKey?: string | null): string | undefined {
  if (!storageKey) return undefined;
  return `${FILE_ORIGIN}/static/${storageKey.replace(/^uploads\//, '')}`;
}

export async function quoteOrder(input: CreateOrderInput): Promise<PriceBreakdown> {
  const { data } = await api.post<ApiResponse<PriceBreakdown>>('/orders/quote', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>('/orders', input);
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function listOrders(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const { data } = await api.get<ApiResponse<Order[]>>(`/orders?${qs.toString()}`);
  if (!data.success) throw new Error(data.message);
  return { items: data.data, meta: data.meta };
}

export function getOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`);
}

export function trackOrder(reference: string): Promise<Order> {
  return apiGet<Order>(`/orders/track/${encodeURIComponent(reference)}`);
}

export const ORDER_STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  PENDING_PAYMENT: { label: 'Pending payment', variant: 'outline' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary' },
  ASSIGNED: { label: 'Driver assigned', variant: 'secondary' },
  PICKED_UP: { label: 'Picked up', variant: 'secondary' },
  IN_TRANSIT: { label: 'In transit', variant: 'default' },
  AT_WAREHOUSE: { label: 'At warehouse', variant: 'secondary' },
  AT_BRANCH: { label: 'At branch', variant: 'secondary' },
  AT_DESTINATION_BRANCH: { label: 'At destination branch', variant: 'secondary' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', variant: 'default' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', variant: 'default' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  RETURNED: { label: 'Returned', variant: 'destructive' },
};

export const TRACKING_STEPS: Array<{ key: string; label: string }> = [
  { key: 'CONFIRMED', label: 'Order Confirmed' },
  { key: 'ASSIGNED', label: 'Driver Assigned' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];
