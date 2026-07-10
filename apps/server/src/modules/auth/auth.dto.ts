
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'BRANCH_STAFF';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email?: string;
  phone?: string;
}

export interface ResetPasswordDto {
  email?: string;
  phone?: string;
  password: string;
  /** @deprecated JWT link flow — use OTP verification instead */
  token?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileLocationDto {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}
