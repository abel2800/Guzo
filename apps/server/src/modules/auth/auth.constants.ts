export const AUTH_MESSAGES = {
  REGISTERED: 'Registration successful',
  LOGGED_IN: 'Login successful',
  LOGGED_OUT: 'Logged out successfully',
  TOKEN_REFRESHED: 'Token refreshed',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_TAKEN: 'An account with this email already exists',
  RESET_SENT: 'If the email exists, a reset link has been sent',
  PASSWORD_RESET: 'Password has been reset',
  PROFILE_UPDATED: 'Profile updated',
  PASSWORD_CHANGED: 'Password changed',
  AVATAR_UPDATED: 'Profile picture updated',
} as const;

export const DEFAULT_REGISTER_ROLE = 'CUSTOMER';
