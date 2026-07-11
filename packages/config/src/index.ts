
export const API_PREFIX = '/api/v1';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
  BRANCH_STAFF: 'BRANCH_STAFF',
  DRIVER: 'DRIVER',
  MERCHANT: 'MERCHANT',
  CUSTOMER: 'CUSTOMER',
  SUPPORT: 'SUPPORT',
  FINANCE: 'FINANCE',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
} as const;

export const UPLOAD_FOLDERS = {
  IMAGES: 'images',
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
  DRIVER_LICENSE: 'driver-license',
  PROOF_OF_DELIVERY: 'proof-of-delivery',
  PARCEL_IMAGES: 'parcel-images',
  VEHICLE_PHOTOS: 'vehicle-photos',
} as const;

export const FRONTEND_PORTS = {
  CUSTOMER: 3000,
  ADMIN: 3001,
  MERCHANT: 3002,
  DRIVER: 3003,
} as const;

/** Demo/fake payment methods — hidden in production builds. */
export function isDemoPaymentsEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return false;
  const g = globalThis as { __DEV__?: boolean };
  if (typeof g.__DEV__ === 'boolean') return g.__DEV__;
  return true;
}

export const CUSTOMER_PAYMENT_METHODS = ['CASH_ON_DELIVERY', 'TELEBIRR', 'CBE', 'CHAPA', 'CARD'] as const;
export const DEMO_PAYMENT_METHOD = 'FAKE' as const;
