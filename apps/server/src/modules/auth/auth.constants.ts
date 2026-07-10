import type { Role } from '@delivery/types';

export const AUTH_MESSAGES = {
  REGISTERED: 'Registration successful',
  LOGGED_IN: 'Login successful',
  LOGGED_OUT: 'Logged out successfully',
  TOKEN_REFRESHED: 'Token refreshed',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_TAKEN: 'An account with this email already exists',
  RESET_SENT: 'If an account exists, a verification code was sent to the registered phone.',
  RESET_OTP_SENT: 'Verification code sent. Check your phone (or the API server terminal in dev).',
  PASSWORD_RESET: 'Password has been reset',
  PROFILE_UPDATED: 'Profile updated',
  PASSWORD_CHANGED: 'Password changed',
  AVATAR_UPDATED: 'Profile picture updated',
} as const;

export const DEFAULT_REGISTER_ROLE = 'CUSTOMER';

/** Roles that require admin approval before the account can sign in. */
export const APPROVAL_REGISTER_ROLES = new Set<Role>(['DRIVER', 'MERCHANT', 'BRANCH_STAFF']);

export const PENDING_APPROVAL_MESSAGE =
  'Your account was submitted for review. An admin will approve it before you can sign in.';
