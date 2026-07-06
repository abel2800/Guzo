export * from './types';
export * from './storage';
export * from './api';
export * from './auth';
export * from './orders';
export * from './addresses';
export * from './dashboard';
export * from './merchant';
export * from './socket';
export * from './notifications';
export * from './offline';
export * from './biometric';

export const GUZO_COLORS = {
  bg: '#050816',
  card: '#0F172A',
  primary: '#22C55E',
  accent: '#10B981',
  text: '#FFFFFF',
  muted: '#CBD5E1',
  border: 'rgba(255,255,255,0.1)',
} as const;
