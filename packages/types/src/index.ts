
export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_STAFF'
  | 'BRANCH_STAFF'
  | 'DRIVER'
  | 'MERCHANT'
  | 'CUSTOMER'
  | 'SUPPORT'
  | 'FINANCE';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
  errors?: FieldError[];
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

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [filter: string]: unknown;
}

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
  phone?: string | null;
  guzoId?: string | null;
  gender?: string;
  avatarUrl?: string | null;
  roles: Role[];
  permissions: string[];
}

export interface UserProfileAddress {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isDefault: boolean;
}

export interface UserProfile extends AuthUser {
  createdAt: string;
  defaultAddress?: UserProfileAddress | null;
  walletBalance?: number | null;
  walletCurrency?: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterPendingResponse {
  pending: true;
  message: string;
  user: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName' | 'roles'>;
}

export type RegisterResponse = LoginResponse | RegisterPendingResponse;

export function isRegisterPending(
  response: RegisterResponse,
): response is RegisterPendingResponse {
  return 'pending' in response && response.pending === true;
}

export interface JwtPayload {
  sub: string;   email: string;
  roles: Role[];
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export const SOCKET_EVENTS = {
    DRIVER_LOCATION: 'driver:location',
  ORDER_TRACKING: 'order:tracking',
    DRIVER_STATUS: 'driver:status',
  ORDER_STATUS: 'order:status',
    NOTIFICATION_NEW: 'notification:new',
    CHAT_MESSAGE: 'chat:message',
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
