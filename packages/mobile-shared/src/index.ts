export * from './wallet';
export * from './parcels';
export * from './branches';
export * from './branch-ops';
export * from './receivers';
export * from './family';
export * from './support';
export * from './otp';
export * from './invoices';
export * from './types';
export * from './storage';
export * from './api';
export * from './auth';
export * from './orders';
export * from './driver-ops';
export * from './addresses';
export * from './dashboard';
export * from './merchant';
export * from './socket';
export * from './notifications';
export * from './offline';
export * from './scan-queue';
export * from './biometric';
export * from './maps';
export type { MapAddress } from './map-types';
export { useTrackingMapData } from './use-tracking-map-data';

export const GUZO_COLORS = {
  bg: '#050816',
  card: '#0F172A',
  primary: '#22C55E',
  accent: '#10B981',
  text: '#FFFFFF',
  muted: '#CBD5E1',
  border: 'rgba(255,255,255,0.1)',
} as const;
