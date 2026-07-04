/** Data Transfer Objects: the validated shapes that cross the controller->service boundary. */

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'CUSTOMER' | 'MERCHANT' | 'DRIVER';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}
