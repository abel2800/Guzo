export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'SCHEDULED' | 'INTERNATIONAL';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_BRANCH'
  | 'AT_WAREHOUSE'
  | 'AT_DESTINATION_BRANCH'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export type PickupMethod = 'COMPANY_PICKUP' | 'DROP_AT_BRANCH' | 'BRANCH_PICKUP';
export type PaymentMethod = 'FAKE' | 'CASH_ON_DELIVERY' | 'TELEBIRR' | 'CBE' | 'CHAPA' | 'CARD';

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
  paymentMethod?: PaymentMethod;
  pickupMethod?: PickupMethod;
  receiverPhone?: string;
  receiverGuzoId?: string;
  originBranchId?: string;
  destinationBranchId?: string;
  hasInsurance?: boolean;
  insuranceAmount?: number;
  couponCode?: string;
  notes?: string;
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
  trackingEvents?: Array<{ id: string; type: string; status: string; description?: string | null; createdAt: string }>;
  payment?: { status: string; amount: number; currency: string; checkoutUrl?: string } | null;
  delivery?: {
    driver?: {
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
  today?: {
    pickups: number;
    deliveries: number;
    intercity: number;
    available: number;
  };
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
  parcels?: {
    active: number;
    incoming: number;
    readyForPickup: number;
    delivered: number;
    draft: number;
  };
  recentOrders?: Array<{ id: string; orderNumber: string; status: string; createdAt: string }>;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_PAYMENT: 'Pending payment',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Driver assigned',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  AT_BRANCH: 'At branch',
  AT_WAREHOUSE: 'At warehouse',
  AT_DESTINATION_BRANCH: 'At destination branch',
  READY_FOR_PICKUP: 'Ready for pickup',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const DRIVER_NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string; slide?: boolean }>> = {
  PICKED_UP: { next: 'IN_TRANSIT', label: 'Slide to start trip', slide: true },
  IN_TRANSIT: { next: 'OUT_FOR_DELIVERY', label: 'Slide — out for delivery', slide: true },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Mark delivered' },
  FAILED: { next: 'OUT_FOR_DELIVERY', label: 'Reattempt delivery' },
};

export const DRIVER_ALT_STATUS: Partial<Record<OrderStatus, Array<{ next: OrderStatus; label: string }>>> = {
  PICKED_UP: [
    { next: 'AT_BRANCH', label: 'Drop at branch' },
    { next: 'AT_WAREHOUSE', label: 'Deliver to warehouse' },
  ],
  IN_TRANSIT: [{ next: 'AT_WAREHOUSE', label: 'Arrive at warehouse' }],
  OUT_FOR_DELIVERY: [{ next: 'FAILED', label: 'Mark failed delivery' }],
};
