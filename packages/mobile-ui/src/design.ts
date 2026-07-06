import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#050816',
  bgElevated: '#0A0F1E',
  surface: '#0F172A',
  surfaceGlass: 'rgba(15, 23, 42, 0.65)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderGlow: 'rgba(34, 197, 94, 0.35)',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  primary: '#22C55E',
  primaryDark: '#16A34A',
  accent: '#06B6D4',
  accentPurple: '#8B5CF6',
  warning: '#FBBF24',
  error: '#EF4444',
  success: '#22C55E',
  info: '#38BDF8',
} as const;

export const gradients = {
  hero: ['#050816', '#0F172A', '#064E3B'] as const,
  primary: ['#22C55E', '#06B6D4'] as const,
  card: ['rgba(34,197,94,0.12)', 'rgba(6,182,212,0.08)'] as const,
  avatar: ['#22C55E', '#8B5CF6', '#06B6D4'] as const,
  promo1: ['#1E3A5F', '#0F172A'] as const,
  promo2: ['#064E3B', '#0F172A'] as const,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  float: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  hero: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const designStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenPad: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
});
