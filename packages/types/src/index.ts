// ============================================================================
// Shared API contracts. Frontends and backend agree on these shapes so the
// HTTP boundary is fully typed end-to-end.
// ============================================================================

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_STAFF'
  | 'DRIVER'
  | 'MERCHANT'
  | 'CUSTOMER'
  | 'SUPPORT'
  | 'FINANCE';

/** Standard success envelope returned by every endpoint. */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/** Standard error envelope returned by every endpoint. */
export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
  errors?: FieldError[];
  /** Only present in development. */
  stack?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Standard list-query parameters supported by index endpoints. */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [filter: string]: unknown;
}

// ---- Auth payloads ----
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  permissions: string[];
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/** JWT access-token claims. */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  roles: Role[];
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// ---- Realtime (Socket.IO) event names ----
export const SOCKET_EVENTS = {
  // tracking
  DRIVER_LOCATION: 'driver:location',
  ORDER_TRACKING: 'order:tracking',
  // status
  DRIVER_STATUS: 'driver:status',
  ORDER_STATUS: 'order:status',
  // notifications
  NOTIFICATION_NEW: 'notification:new',
  // chat
  CHAT_MESSAGE: 'chat:message',
  // admin
  ADMIN_METRICS: 'admin:metrics',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export interface DriverLocationPayload {
  driverId: string;
  orderId?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  recordedAt: string;
}
