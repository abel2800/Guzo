import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, shadow } from '@/lib/design';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  glow?: boolean;
}

export function GlassCard({ children, style, intensity = 40, glow }: GlassCardProps) {
  return (
    <View style={[styles.wrap, glow && styles.glow, shadow.card, style]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
      ) : (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
  },
  webBlur: { backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  glow: {
    borderColor: colors.borderGlow,
  },
  inner: {
    padding: 16,
  },
});
