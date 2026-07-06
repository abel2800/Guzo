export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'SCHEDULED' | 'INTERNATIONAL';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_WAREHOUSE'
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

export interface CreateOrderInput {
  deliveryType?: DeliveryType;
  pickup: AddressInput;
  dropoff: AddressInput;
  package: PackageInput;
  couponCode?: string;
  notes?: string;
  /** ISO datetime — used with deliveryType SCHEDULED */
  scheduledPickupAt?: string;
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
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  isDefault?: boolean;
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
  scheduledPickupAt?: string | null;
  estimatedDeliveryAt?: string | null;
  pickupAddress: Address;
  dropoffAddress: Address;
  packages: Array<{ id: string; trackingNumber: string; weightKg: number; description?: string | null }>;
  trackingEvents?: Array<{ id: string; type: string; status: string; description?: string | null; createdAt: string }>;
  payment?: { status: string; amount: number; currency: string } | null;
  delivery?: {
    driver?: { user?: { firstName: string; lastName: string; phone?: string | null } | null } | null;
  } | null;
}

export interface DriverSummary {
  driverCode: string;
  status: string;
  isAvailable: boolean;
  earningsBalance: number;
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
}

export interface MerchantSummary {
  merchantCode: string;
  businessName: string;
  totals: {
    orders: number;
    delivered: number;
    inTransit: number;
    pendingPayment: number;
    revenue: number;
  };
}

export interface CustomerSummary {
  totals: { orders: number; inTransit: number; delivered: number; openTickets: number };
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending payment',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Driver assigned',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  AT_WAREHOUSE: 'At warehouse',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const DRIVER_NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  ASSIGNED: { next: 'PICKED_UP', label: 'Mark picked up' },
  PICKED_UP: { next: 'IN_TRANSIT', label: 'Start transit' },
  IN_TRANSIT: { next: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Mark delivered' },
};
