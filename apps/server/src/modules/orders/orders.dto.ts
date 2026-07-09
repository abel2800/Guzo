export interface AddressInput {
  contactName?: string;
  contactPhone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
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

export interface CreateOrderDto {
    customerId?: string;
  merchantId?: string;
  deliveryType?: 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'SCHEDULED' | 'INTERNATIONAL';
  pickup: AddressInput;
  dropoff: AddressInput;
  package: PackageInput;
  couponCode?: string;
  notes?: string;
  scheduledPickupAt?: string;
}

export interface UpdateOrderStatusDto {
  status:
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
  note?: string;
  latitude?: number;
  longitude?: number;
}

export interface AssignDriverDto {
  driverId: string;
  vehicleId?: string;
}
